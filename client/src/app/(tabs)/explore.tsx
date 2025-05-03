import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, SafeAreaView, ActivityIndicator, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
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
  SlideInDown 
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import IMAGES from '@/src/constants/images';

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
  recommended_user_interest: string;
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
  };
  similarity_score: number;
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
  
  const filterSheetGesture = Gesture.Pan()
    .onStart(() => {
      filterSheetTranslateY.value = withSpring(0);
    })
    .onEnd(() => {
      filterSheetTranslateY.value = withSpring(1000);
    });

  const filterSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: filterSheetTranslateY.value }]
  }));

  const heroStyle = useAnimatedStyle(() => ({
    height: heroHeight.value
  }));

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
                locationText = locationData.city || locationData.district || 
                             locationData.state || locationData.address || 
                             'Location not specified';
              } catch (e) {
                console.error('Error parsing location:', e);
              }
            }

            // Parse interests
            const interestsStr = rec.recommended_user_interest || '';
            const interests = interestsStr
              .replace(/[{}"]/g, '') // Remove all braces and quotes
              .split(',')
              .map(i => i.trim())
              .filter(i => i);

            // Get similarity score from the map
            const similarity_score = profileMap.get(profileId) || rec.similarity_score || 0;

          
            return {
              username: rec.recommended_user_username,
              age: rec.recommended_user_age,
              bio: rec.recommended_user_bio,
              gender: rec.recommended_user_gender,
              interests: interests,
              location: locationText,
              occupation: rec.recommended_user_occupation,
              profile_photo: rec.recommended_user_photo,
              prompts: rec.recommended_user_prompts || { prompts: [] },
              similarity_score: similarity_score,
              recommended_user_profile_id: profileId
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

  // Function to handle swipe action
  const handleSwipe = async (direction: string) => {
    if (isLimited) {
      Toast.show({
        type: 'info',
        text1: 'Limit Reached',
        text2: `Try again later when swipes reset`,
      });
      return;
    }

    if (!recommendations[currentIndex]) {
      return;
    }

    // Animate card out
    if (direction === 'right') {
      cardScale.value = withTiming(1.05, { duration: 200 });
      cardOpacity.value = withTiming(0, { duration: 300 });
      cardOffsetY.value = withTiming(-100, { duration: 300 });
    } else {
      cardScale.value = withTiming(0.95, { duration: 200 });
      cardOpacity.value = withTiming(0, { duration: 300 });
      cardOffsetY.value = withTiming(100, { duration: 300 });
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) throw new Error('No access token found');

      const targetUsername = recommendations[currentIndex].username;
      const apiPayload = {
        target_username: targetUsername,
        direction: direction === 'right' ? 'right' : 'left'
      };

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
      }

      // Check for matches only after successful right swipe
      if (direction === 'right' && swipeResponse.data.status === 'success') {
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

      // Update index and reset animation values after a small delay
      setTimeout(() => {
        setCurrentIndex(prev => Math.min(prev + 1, recommendations.length - 1));
        cardOpacity.value = withTiming(1, { duration: 300 });
        cardScale.value = withTiming(1, { duration: 300 });
        cardOffsetY.value = withTiming(0, { duration: 300 });
      }, 300);

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
      
      // Reset animation
      cardOpacity.value = withTiming(1, { duration: 300 });
      cardScale.value = withTiming(1, { duration: 300 });
      cardOffsetY.value = withTiming(0, { duration: 300 });
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
          <Ionicons name="search" size={48} color="#7D5BA6" style={{ marginBottom: 24, opacity: 0.8 }} />
          <Animated.Text
            entering={FadeInDown.delay(200).springify()}
            style={{ color: '#7D5BA6', fontSize: 22, fontWeight: 'bold', textAlign: 'center', letterSpacing: 0.5 }}
          >
            Finding your perfect matches…
          </Animated.Text>
          <ActivityIndicator size="large" color="#7D5BA6" style={{ marginTop: 24 }} />
        </Animated.View>
      </View>
    );
  }
  

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white p-4">
        <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
        <Text className="mt-4 text-center text-neutral-800 font-medium text-lg">
          {error}
        </Text>
        <TouchableOpacity
          onPress={refreshAll}
          className="mt-4 bg-[#45B7D1] px-6 py-3 rounded-full"
        >
          <Text className="text-white font-medium">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Hero Section */}
      <Animated.View style={heroStyle} className="relative">
        <LinearGradient
          colors={['rgba(69, 183, 209, 0.1)', 'rgba(69, 183, 209, 0.05)']}
          className="absolute inset-0"
        />
        <View className="px-6 py-4">
          <Animated.Text 
            entering={FadeInDown.delay(200)}
            className="text-2xl font-bold text-neutral-800"
          >
            Discover
          </Animated.Text>
          <Animated.Text
            entering={FadeInDown.delay(300)}
            className="text-base text-neutral-600 mt-2"
          >
            Find your perfect travel companion
          </Animated.Text>
          
        </View>
      </Animated.View>

      {/* Main Content */}
      <View className="flex-1 px-4">
        {recommendations.length > 0 ? (
          <UserCard
            profile={recommendations[currentIndex]}
            onSwipeLeft={() => handleSwipe('left')}
            onSwipeRight={() => handleSwipe('right')}
          />
        ) : (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="search" size={64} color="#E6E4EC" />
            <Text className="mt-4 text-center text-neutral-600">
              No more recommendations available.
              Check back later!
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <Animated.View 
        entering={SlideInDown.delay(400)}
        className="flex-row justify-center items-center pb-8 pt-4"
      >
        <TouchableOpacity
          onPress={() => handleSwipe('left')}
          className="w-14 h-14 rounded-full bg-white shadow-md items-center justify-center mx-4"
        >
          <Ionicons name="close" size={24} color="#FF6B6B" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => handleSwipe('right')}
          className="w-14 h-14 rounded-full bg-[#45B7D1] shadow-md items-center justify-center mx-4"
        >
          <Ionicons name="heart" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Swipe Limit Warning */}
      {isLimited && (
        <BlurView
          intensity={20}
          tint="light"
          className="absolute inset-0 items-center justify-center"
          style={{ zIndex: 10 }}
        >
          <View className="bg-white rounded-2xl p-6 m-4 shadow-lg items-center">
            {/* Unsplash or custom image for reset */}
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80' }}
              style={{ width: 180, height: 120, borderRadius: 18, marginBottom: 18, opacity: 0.95 }}
              resizeMode="cover"
            />
            <Ionicons name="timer-outline" size={48} color="#45B7D1" style={{ marginBottom: 8 }} />
            <Text className="text-xl font-bold text-center mt-2 text-neutral-darkest">
              Daily Limit Reached
            </Text>
            <Text className="text-neutral-600 text-center mt-2 mb-2">
              You've used all {totalLimit} swipes for today. Check back tomorrow for more matches!
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/premium' as any)}
              className="mt-4 bg-[#45B7D1] rounded-full py-3 px-8"
              style={{ minWidth: 180 }}
            >
              <Text className="text-white text-center font-medium">
                Get Premium for Unlimited Swipes
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1B26',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFF',
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
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'YoungSerif-Regular',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFF',
    fontFamily: 'Montserrat-Medium',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
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
  refreshButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 20,
  },
  refreshOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
}); 