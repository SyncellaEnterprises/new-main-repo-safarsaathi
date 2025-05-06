import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, SafeAreaView, ActivityIndicator, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { UserCard } from '@/src/components/explore/UserCard';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  FadeIn, 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withTiming, 
  FadeInDown,
  SlideInDown,
  FadeInUp 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swiper from 'react-native-deck-swiper';
import IMAGES from '@/src/constants/images';

const { width, height } = Dimensions.get('window');

// Set API URL to your local server
const API_URL = 'http://10.0.2.2:5000';

// Configure axios retry functionality for all axios instances
axiosRetry(axios, {
  retries: 3,
  retryDelay: (retryCount: number) => {
    return retryCount * 1000; // exponential backoff: 1s, 2s, 3s
  },
  retryCondition: (error: any) => {
    return (
      error.code === 'ERR_NETWORK' || 
      error.code === 'ECONNABORTED' ||
      (error.response && error.response.status >= 500)
    );
  },
  onRetry: (retryCount: number, error: any) => {
    console.log(`Retry attempt #${retryCount} for error: ${error.code}`);
  }
});

// Create an instance with this configuration if needed for specific customization
const axiosInstance = axios.create();

interface RecommendationResponse {
  recommended_user_username: string;
  recommended_user_age: number;
  recommended_user_bio: string;
  recommended_user_created_at: string;
  recommended_user_gender: string;
  recommended_user_interest: string | null;
  recommended_user_location: string | null;
  recommended_user_occupation: string;
  recommended_user_photo: string | null;
  recommended_user_profile_id?: number;
  recommended_user_profile_user_id?: number;
  recommended_user_prompts: {
    prompts: Array<{
      question: string;
      answer: string;
    }>;
  } | null;
  similarity_score: number;
  recommended_user_isverified: boolean;
  level?: number;
}

interface LocationData {
  state?: string;
  city?: string;
  district?: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface TransformedProfile {
  username: string;
  age: number;
  bio: string;
  gender: string;
  interests: string[];
  location: string;
  occupation: string;
  profile_photo: string | null;
  prompts: {
    prompts: Array<{
      question: string;
      answer: string;
    }>;
  };
  similarity_score: number;
  recommended_user_profile_id: number;
  isVerified: boolean;
  level: number;
}

interface SwiperRef {
  swipeLeft: () => void;
  swipeRight: () => void;
}

interface ConfettiRef {
  start: () => void;
}

interface SwipeResponse {
  remaining_swipes: number;
  status: string;
  total_limit: number;
}

export default function ExploreScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipesRemaining, setSwipesRemaining] = useState(10); // Default value
  const [totalLimit, setTotalLimit] = useState(10); // Default value
  const [isLimited, setIsLimited] = useState(false);
  const [recommendations, setRecommendations] = useState<TransformedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const cardOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);
  const cardOffsetY = useSharedValue(0);

  // New animated values for modern UI
  const heroHeight = useSharedValue(200);
  const filterSheetTranslateY = useSharedValue(1000);
  
  const filterSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: filterSheetTranslateY.value }]
  }));

  const heroStyle = useAnimatedStyle(() => ({
    height: heroHeight.value
  }));

  // Swiper reference
  const swiperRef = useRef<Swiper<TransformedProfile>>(null);

  // Check remaining swipes
  const checkRemainingSwipes = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token found');
      }

      console.log('Checking remaining swipes...');
      const response = await axios.post(
        `${API_URL}/api/swipes/remaining`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 seconds timeout
        }
      );

      console.log('Remaining swipes response:', response.data);

      if (response.data.status === 'success') {
        setSwipesRemaining(response.data.remaining_swipes);
        setTotalLimit(response.data.total_limit);
        
        // If no swipes remaining, user is limited
        setIsLimited(response.data.remaining_swipes <= 0);
      }
    } catch (error: any) {
      console.error('Error checking remaining swipes:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to check remaining swipes'
      });
    }
  }, []);

  // Function to refetch everything - used for pull-to-refresh or retry button
  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    setCurrentIndex(0);
    await checkRemainingSwipes();
    await fetchRecommendations();
    setRefreshing(false);
  }, [checkRemainingSwipes]);

  // Load initial data
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        setLoading(true);
        // First check swipes
        await checkRemainingSwipes();
        // Then fetch recommendations
        await fetchRecommendations();
      } catch (error) {
        console.error('Error initializing explore screen:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeScreen();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token found');
      }

      // Step 1: Get recommended user IDs and similarity scores
      console.log('Fetching initial recommendations...');
      try {
        const recommendationResponse = await axios.post(
          `${API_URL}/user/recommendation`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 60000 // 60 seconds to allow for model loading time
          }
        );

        console.log('Initial recommendation IDs:', recommendationResponse.data);
        
        if (recommendationResponse.data.status !== 'success') {
          throw new Error(recommendationResponse.data.message || 'Failed to get initial recommendations');
        }

        // Create a map of profile IDs to similarity scores
        const profileMap = new Map<number, number>();
        recommendationResponse.data.recommended_users.forEach((id: number, index: number) => {
          profileMap.set(id, recommendationResponse.data.similarity_scores[index]);
        });

        // Step 2: Get detailed user profiles
        console.log('Fetching detailed profiles...');
        const detailedResponse = await axios.get(
          `${API_URL}/api/recommended_users/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Detailed profiles raw data:', detailedResponse.data);

        if (!detailedResponse.data?.recommended_users?.length) {
          throw new Error('No recommendations available');
        }

        // Transform the data
        const mappedProfiles: (TransformedProfile | null)[] = detailedResponse.data.recommended_users.map(
          (rec: RecommendationResponse) => {
            // Get profile ID from either field name (handle API inconsistency)
            const profileId = rec.recommended_user_profile_id || rec.recommended_user_profile_user_id;
            
            console.log('Processing profile with ID:', profileId);
            
            if (!profileId) {
              console.error('Missing profile ID in recommendation:', rec);
              // Instead of throwing error, log and skip this profile
              console.warn('Skipping profile due to missing ID');
              return null;
            }

            // Parse location data
            let locationText = 'Location not specified';
            if (rec.recommended_user_location) {
              try {
                const locationData: LocationData = JSON.parse(rec.recommended_user_location);
                // Only show city and state as requested
                if (locationData.city && locationData.state) {
                  locationText = `${locationData.city}, ${locationData.state}`;
                } else if (locationData.city) {
                  locationText = locationData.city;
                } else if (locationData.state) {
                  locationText = locationData.state;
                } else {
                  locationText = 'Location not specified';
                }
              } catch (e) {
                console.error('Error parsing location:', e);
              }
            }

            // Parse interests
            const interestsStr = rec.recommended_user_interest || '';
            let interests: string[] = [];
            
            if (interestsStr) {
              interests = interestsStr
                .replace(/[{}"]/g, '') // Remove all braces and quotes
                .split(',')
                .map(i => i.trim())
                .filter(i => i);
            }

            // Get similarity score from the map
            const similarity_score = profileMap.get(profileId) || rec.similarity_score || 0;

          
            return {
              username: rec.recommended_user_username,
              age: rec.recommended_user_age,
              bio: rec.recommended_user_bio,
              gender: rec.recommended_user_gender || 'Not specified',
              interests: interests,
              location: locationText,
              occupation: rec.recommended_user_occupation,
              profile_photo: rec.recommended_user_photo,
              prompts: rec.recommended_user_prompts || { prompts: [] },
              similarity_score: similarity_score,
              recommended_user_profile_id: profileId,
              isVerified: rec.recommended_user_isverified || false,
              level: rec.level || 0
            };
          }
        );

        // Filter out any null entries (skipped profiles)
        const transformedProfiles: TransformedProfile[] = mappedProfiles.filter(
          (profile): profile is TransformedProfile => profile !== null
        );

        if (transformedProfiles.length === 0) {
          throw new Error('No valid profiles found');
        }

        // Sort by similarity score
        const sortedProfiles = transformedProfiles.sort(
          (a: TransformedProfile, b: TransformedProfile) => 
            b.similarity_score - a.similarity_score
        );

        console.log('Transformed profiles:', sortedProfiles);
        setRecommendations(sortedProfiles);
      } catch (recommendationError: any) {
        // Handle errors specifically from recommendation model
        if (recommendationError.response?.status === 503) {
          // This is likely a recommendation model loading issue
          setError("The recommendation system is currently initializing. Please try again in a few moments.");
          Toast.show({
            type: 'info',
            text1: 'System Initializing',
            text2: 'The recommendation system is starting up. Please wait a moment and try again.',
            visibilityTime: 5000
          });
        } else {
          // Handle other errors
          throw recommendationError;
        }
      }
      
    } catch (error: any) {
      // Main error handling for the entire function
      console.error('Fetch error:', {
        message: error.message,
        code: error.code,
        config: error.config,
        response: error.response?.data
      });
      const errorMessage = error.response?.data?.message || 
                         error.code === 'ECONNABORTED' ? 'Request timed out' :
                         error.message || 'Network error';
      setError(errorMessage);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Modified swipe handler to work with the deck swiper
  const handleSwipe = async (direction: 'left' | 'right', index: number) => {
    if (direction === 'right' && isLimited) {
      Toast.show({
        type: 'info',
        text1: 'Limit Reached',
        text2: `Try again later when swipes reset`,
      });
      return;
    }

    if (!recommendations[index]) {
      return;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) throw new Error('No access token found');

      const targetUsername = recommendations[index].username;
      const apiPayload = {
        target_username: targetUsername,
        direction: direction === 'right' ? 'right' : 'left'
      };

      // Only make API call for right swipes if we're not limited
      if (direction === 'right') {
        const swipeResponse = await axios.post(
          `${API_URL}/api/swipe`,
          apiPayload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          }
        );

        if (swipeResponse.data.status === 'success') {
          setSwipesRemaining(swipeResponse.data.remaining_swipes);
          setTotalLimit(swipeResponse.data.total_limit);
          setIsLimited(swipeResponse.data.remaining_swipes <= 0);

          // Check for matches after right swipe
          try {
            const matchResponse = await axios.get(
              `${API_URL}/api/matches/me`,
              {
                headers: { 
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
                timeout: 10000 // 10 second timeout
              }
            );

            if (matchResponse.data?.matches?.length > 0) {
              const isMatch = matchResponse.data.matches.some(
                (match: any) => match.matched_username === targetUsername
              );

              if (isMatch) {
                Toast.show({
                  type: 'success',
                  text1: 'Match! 🎉',
                  text2: `You matched with ${targetUsername}!`,
                  visibilityTime: 4000,
                  autoHide: true,
                  topOffset: 60
                });
              }
            }
          } catch (matchError: any) {
            console.error('Match check error:', matchError);
          }
        }
      } else {
        // For left swipes, just record the swipe without deducting from limit
        await axios.post(
          `${API_URL}/api/swipe`,
          apiPayload,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000 // 10 second timeout
          }
        );
      }

    } catch (error: any) {
      console.error('Swipe error:', error);
      
      const errorMessage = error.response?.data?.message || 
                        error.response?.status === 404 ? 'Endpoint not found or invalid username' :
                        error.message || 'Swipe failed';

      Toast.show({ 
        type: 'error', 
        text1: 'Swipe Error', 
        text2: errorMessage,
        visibilityTime: 3000
      });
    }
  };

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [
        { scale: cardScale.value },
        { translateY: cardOffsetY.value }
      ]
    };
  });

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        {/* Pattern background */}
        <Animated.Image
          source={IMAGES.patternBg}
          style={{
            position: 'absolute',
            width: '120%',
            height: '120%',
            opacity: 0.13,
            top: '-10%',
            left: '-10%',
          }}
          resizeMode="cover"
        />
        {/* Pattern bag floating */}
        <Animated.Image
          source={IMAGES.patternBag}
          entering={FadeInDown.springify()}
          style={{
            position: 'absolute',
            width: 120,
            height: 120,
            bottom: 80,
            right: 40,
            opacity: 0.18,
            transform: [{ rotate: '-12deg' }],
          }}
          resizeMode="contain"
        />
        {/* Unsplash travel image */}
        <Animated.Image
          source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80' }}
          style={{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 32,
            opacity: 0.18,
            top: 60,
            left: 40,
          }}
          resizeMode="cover"
        />
        <BlurView intensity={40} tint="light" style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }}>
          <LinearGradient
            colors={["rgba(125,91,166,0.12)", "rgba(80,166,167,0.10)", "rgba(255,255,255,0.7)"]}
            style={{ ...StyleSheet.absoluteFillObject }}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </BlurView>
        <Animated.View entering={FadeInDown.springify()} style={{ alignItems: 'center', zIndex: 2 }}>
          <Ionicons name="search" size={56} color="#7D5BA6" style={{ marginBottom: 28, opacity: 0.8 }} />
          <Animated.Text
            entering={FadeInDown.delay(200).springify()}
            style={{ 
              color: '#7D5BA6', 
              fontSize: 24, 
              fontWeight: 'bold', 
              textAlign: 'center', 
              letterSpacing: 0.5, 
              marginBottom: 6 
            }}
          >
            Finding your perfect matches…
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(300).springify()}
            style={{ 
              color: '#666', 
              fontSize: 16, 
              textAlign: 'center', 
              marginHorizontal: 30,
              marginBottom: 32
            }}
          >
            We're searching for travelers matching your interests
          </Animated.Text>
          <ActivityIndicator size="large" color="#7D5BA6" style={{ marginTop: 8 }} />
        </Animated.View>
      </View>
    );
  }
  

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-6">
        <LinearGradient
          colors={['rgba(69, 183, 209, 0.05)', 'rgba(69, 183, 209, 0.01)']}
          style={{...StyleSheet.absoluteFillObject}}
        />
        <Animated.View 
          entering={FadeInUp.duration(400)}
          className="bg-white shadow-md rounded-3xl p-8 w-full items-center"
          style={{
            shadowColor: '#7D5BA6',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 5,
          }}
        >
          <Ionicons name="alert-circle-outline" size={70} color="#FF6B6B" />
          <Text className="mt-5 text-center text-neutral-800 font-semibold text-xl">
            {error}
          </Text>
          <Text className="mt-2 text-center text-neutral-500 mb-6">
            We couldn't load your recommendations at this time
          </Text>
          <TouchableOpacity
            onPress={refreshAll}
            className="mt-4 bg-[#45B7D1] px-8 py-4 rounded-full"
            style={{
              shadowColor: '#45B7D1',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-white font-semibold text-lg">Try Again</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView className="flex-1 bg-[#FBFBFD]">
        {/* Hero Section */}
        <Animated.View 
          style={[heroStyle, { height: 60 }]} 
          className="relative overflow-hidden"
        >
          <LinearGradient
            colors={['rgba(125,91,166,0.05)', 'rgba(69, 183, 209, 0.03)']}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          />
          <View className="px-7 py-2 flex-row justify-between items-center">
            <View>
              <Animated.Text 
                entering={FadeInDown.delay(200)}
                className="text-xl font-bold text-neutral-800"
                style={{ letterSpacing: 0.5 }}
              >
                Discover
              </Animated.Text>
              <Animated.Text
                entering={FadeInDown.delay(300)}
                className="text-sm text-neutral-500"
              >
                Find your perfect travel companion
              </Animated.Text>
            </View>
            
            {/* Swipes Counter */}
            <Animated.View
              entering={FadeInDown.delay(400)}
              className="rounded-full bg-white px-3 py-1 flex-row items-center"
              style={{
                shadowColor: '#7D5BA6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <Ionicons name="flame-outline" size={14} color="#7D5BA6" />
              <Text className="text-[#7D5BA6] font-medium text-sm ml-1">
                {swipesRemaining}/{totalLimit}
              </Text>
            </Animated.View>
          </View>
        </Animated.View>

        {/* Main Content */}
        <View className="flex-1 px-4 pb-16 pt-2">
          {recommendations.length > 0 && !isLimited ? (
            <Swiper
              ref={swiperRef}
              cards={recommendations}
              renderCard={(card) => {
                if (!card) return null;
                return (
                  <UserCard
                    profile={card}
                    onSwipeLeft={() => {}}
                    onSwipeRight={() => {}}
                  />
                );
              }}
              onSwiped={(cardIndex) => {
                // Card was swiped but direction is handled in onSwipedLeft/Right
              }}
              onSwipedLeft={(cardIndex) => handleSwipe('left', cardIndex)}
              onSwipedRight={(cardIndex) => handleSwipe('right', cardIndex)}
              cardIndex={0}
              backgroundColor="transparent"
              stackSize={2}
              stackSeparation={-30}
              stackScale={10}
              infinite={false}
              animateOverlayLabelsOpacity
              overlayLabels={{
                left: {
                  title: 'NOPE',
                  style: {
                    label: {
                      backgroundColor: 'rgba(233, 64, 87, 0.2)',
                      color: '#E94057',
                      fontSize: 24,
                      borderWidth: 1,
                      borderColor: '#E94057',
                      borderRadius: 10
                    },
                    wrapper: {
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'flex-start',
                      marginTop: 30,
                      marginLeft: -30,
                    }
                  }
                },
                right: {
                  title: 'LIKE',
                  style: {
                    label: {
                      backgroundColor: 'rgba(94, 186, 125, 0.2)',
                      color: '#5EBA7D',
                      fontSize: 24,
                      borderWidth: 1,
                      borderColor: '#5EBA7D',
                      borderRadius: 10
                    },
                    wrapper: {
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      marginTop: 30,
                      marginLeft: 30,
                    }
                  }
                }
              }}
              disableTopSwipe
              disableBottomSwipe
              cardHorizontalMargin={0}
              cardVerticalMargin={0}
              outputRotationRange={['-10deg', '0deg', '10deg']}
              verticalSwipe={false}
              containerStyle={{ flex: 1 }}
              swipeBackCard
              horizontalSwipe={true}
              horizontalThreshold={width * 0.25}
              useViewOverflow={false}
              verticalThreshold={height * 0.8}
              zoomFriction={50}
            />
          ) : recommendations.length > 0 && isLimited ? (
            // Daily Limit Card - Same size/style as user cards
            <Animated.View 
              entering={FadeIn.duration(400)}
              style={{
                flex: 1,
                backgroundColor: 'white',
                borderRadius: 24,
                overflow: 'hidden',
                shadowColor: '#7D5BA6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <LinearGradient
                colors={['rgba(125, 91, 166, 0.05)', 'rgba(80, 166, 167, 0.05)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  flex: 1,
                  padding: 2,
                  borderRadius: 24,
                }}
              >
                <View style={{
                  flex: 1,
                  backgroundColor: 'white',
                  borderRadius: 22,
                  alignItems: 'center',
                  padding: 24,
                }}>
                  {/* Top image - night sky */}
                  <Image
                    source={{ uri: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80' }}
                    style={{ 
                      width: '100%',
                      height: 200,
                      borderRadius: 20,
                      marginBottom: 16,
                    }}
                    resizeMode="cover"
                  />
                  
                  {/* Timer Icon */}
                  <View style={{
                    width: 80,
                    height: 80,
                    borderRadius: 40,
                    backgroundColor: 'rgba(125, 91, 166, 0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 20,
                  }}>
                    <Ionicons name="time-outline" size={40} color="#7D5BA6" />
                  </View>
                  
                  {/* Limit Reached Text */}
                  <Text style={{
                    fontSize: 24,
                    fontWeight: 'bold',
                    color: '#333',
                    marginBottom: 12,
                    textAlign: 'center',
                  }}>
                    Daily Limit Reached
                  </Text>
                  
                  <Text style={{
                    fontSize: 16,
                    color: '#666',
                    textAlign: 'center',
                    marginBottom: 30,
                    paddingHorizontal: 20,
                    lineHeight: 22,
                  }}>
                    You've used all {totalLimit} swipes for today. Check back tomorrow for more matches!
                  </Text>
                  
                  {/* Premium Button */}
                  <TouchableOpacity
                    onPress={() => router.push('/(tabs)/premium' as any)}
                    style={{
                      paddingVertical: 14,
                      paddingHorizontal: 24,
                      backgroundColor: '#45B7D1',
                      borderRadius: 30,
                      shadowColor: '#45B7D1',
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.2,
                      shadowRadius: 6,
                      elevation: 4,
                      marginTop: 10,
                    }}
                  >
                    <Text style={{
                      color: 'white',
                      fontSize: 16,
                      fontWeight: '600',
                      textAlign: 'center',
                    }}>
                      Get Premium for Unlimited Swipes
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </Animated.View>
          ) : (
            <Animated.View 
              entering={FadeIn.duration(400)} 
              className="flex-1 items-center justify-center bg-white rounded-3xl shadow-sm px-6"
              style={{
                shadowColor: '#7D5BA6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
                elevation: 2,
              }}
            >
              <Ionicons name="search-outline" size={64} color="#E6E4EC" />
              <Text className="mt-5 text-center text-neutral-600 text-lg font-medium">
                No more recommendations available
              </Text>
              <Text className="mt-2 text-center text-neutral-400 mb-4">
                Check back later for new matches!
              </Text>
              <TouchableOpacity
                onPress={refreshAll}
                className="mt-4 bg-[#45B7D1] px-6 py-3 rounded-full"
              >
                <Text className="text-white font-medium">Refresh</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Action Buttons - Only show when not limited and have recommendations */}
        {recommendations.length > 0 && !isLimited && (
          <Animated.View 
            entering={SlideInDown.delay(400)}
            className="flex-row justify-center items-center"
            style={{
              position: 'absolute',
              bottom: 80,
              left: 0,
              right: 0,
              zIndex: 99
            }}
          >
            <TouchableOpacity
              onPress={() => swiperRef.current?.swipeLeft()}
              className="w-16 h-16 rounded-full bg-white shadow-md items-center justify-center mx-4"
              style={{
                shadowColor: '#FF6B6B',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 5,
                borderWidth: 1,
                borderColor: 'rgba(255,107,107,0.1)',
              }}
            >
              <Ionicons name="close" size={28} color="#FF6B6B" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => swiperRef.current?.swipeRight()}
              className="w-20 h-20 rounded-full shadow-md items-center justify-center mx-4"
              style={{
                shadowColor: '#7D5BA6',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 8,
              }}
            >
              <LinearGradient
                colors={['#7D5BA6', '#50A6A7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: 99,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="heart" size={32} color="white" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFBFD',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#7D5BA6',
    marginTop: 16,
    fontFamily: 'Montserrat',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorBlur: {
    padding: 24,
    borderRadius: 28,
    alignItems: 'center',
    width: '100%',
  },
  errorText: {
    color: '#333',
    fontSize: 20,
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 28,
    backgroundColor: '#45B7D1',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 18,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cardWrapper: {
    width: '100%',
    height: '80%',
    shadowColor: '#7D5BA6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 32,
    marginTop: 24,
  },
  dislikeButton: {
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  likeButton: {
    shadowColor: '#50A6A7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, 
    shadowRadius: 5,
    elevation: 5,
  },
  gradientButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
}); 