import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, SafeAreaView, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import ConfettiCannon from 'react-native-confetti-cannon';
import { UserCard } from '@/src/components/explore/UserCard';
import { SwipeButtons } from '@/src/components/explore/SwipeButtons';
import TabHeader from '@/src/components/shared/TabHeader';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Explosion from 'react-native-confetti-cannon';
import Animated, { FadeIn } from 'react-native-reanimated';

// Set API URL to your local server
const API_URL = 'http://10.0.2.2:5000';

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
  const swiperRef = useRef<Swiper<TransformedProfile>>(null);
  const confettiRef = useRef<Explosion>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipesRemaining, setSwipesRemaining] = useState(10); // Default value
  const [totalLimit, setTotalLimit] = useState(10); // Default value
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [isLimited, setIsLimited] = useState(false);
  const [recommendations, setRecommendations] = useState<TransformedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          }
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
        text2: 'Failed to check remaining swipes'
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
      const recommendationResponse = await axios.post(
        `${API_URL}/user/recommendation`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15 seconds
        }
      );

      console.log('Initial recommendation IDs:', recommendationResponse.data);
      
      if (recommendationResponse.data.status !== 'success') {
        throw new Error('Failed to get initial recommendations');
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

    } catch (error: any) {
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

  const handleSwipe = (direction: string) => {
    // Only handle UI animations here, not API calls
    if (isLimited) {
      Toast.show({
        type: 'info',
        text1: 'Limit Reached',
        text2: `Try again later when swipes reset`,
      });
      return;
    }

    // Trigger swipe animations
    switch (direction) {
      case 'left':
        swiperRef.current?.swipeLeft();
        break;
      case 'right':
      case 'superlike': // Handle superlike as a right swipe with confetti
        swiperRef.current?.swipeRight();
        break;
    }
    
    // Update index immediately after swipe
    setCurrentIndex(prev => Math.min(prev + 1, recommendations.length - 1));
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-primary">
        <TabHeader
          title="Explore"
          leftIcon="people-outline"
          rightIcon="filter-outline"
          onLeftPress={() => router.push("/(tabs)/connections" as any)}
          onRightPress={() => router.push("/(tabs)/filters" as any)}
          gradientColors={['rgba(125, 91, 166, 0.9)', 'rgba(90, 65, 128, 0.8)']}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#FFF" />
          <Text className="text-white mt-4 font-montserrat">Finding your matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || recommendations.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-primary">
        <TabHeader
          title="Explore"
          leftIcon="people-outline"
          rightIcon="filter-outline"
          onLeftPress={() => router.push("/(tabs)/connections" as any)}
          onRightPress={() => router.push("/(tabs)/filters" as any)}
          gradientColors={['rgba(125, 91, 166, 0.9)', 'rgba(90, 65, 128, 0.8)']}
        />
        <View className="flex-1 items-center justify-center p-6">
          <BlurView intensity={20} className="p-6 rounded-3xl items-center">
            <Ionicons name="search" size={48} color="#fff" />
            <Text className="text-white text-xl font-youngSerif mt-4 text-center">
              {error || 'No recommendations found'}
            </Text>
            <TouchableOpacity 
              onPress={refreshAll}
              className="mt-6 bg-white/20 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-montserratMedium">Try Again</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <TabHeader
        title="Explore"
        leftIcon="people-outline"
        rightIcon="filter-outline"
        onLeftPress={() => router.push("/(tabs)/connections" as any)}
        onRightPress={() => router.push("/(tabs)/filters" as any)}
        gradientColors={['rgba(125, 91, 166, 0.9)', 'rgba(90, 65, 128, 0.8)']}
        subtitle={isLimited ? `Swipes Reset Soon` : `${swipesRemaining}/${totalLimit} swipes left`}
      />

      <View className="flex-1">
        {refreshing ? (
          <View className="absolute inset-0 items-center justify-center z-20 bg-black/20">
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : null}
        
        <Swiper
          ref={swiperRef}
          cards={recommendations}
          renderCard={(user) => <UserCard user={user} />}
          onSwipedLeft={(cardIndex) => {
            console.log('Disliked', cardIndex);
            setCurrentIndex(cardIndex + 1);
          }}
          onSwipedRight={(cardIndex) => {
            console.log('Liked', cardIndex);
            setCurrentIndex(cardIndex + 1);
          }}
          onSwipedAll={() => {
            Toast.show({
              type: 'info',
              text1: 'No more profiles',
              text2: 'Check back later for more recommendations!'
            });
          }}
          cardIndex={currentIndex}
          backgroundColor={'transparent'}
          stackSize={3}    
          stackScale={12}  
          stackSeparation={10}
          animateOverlayLabelsOpacity
          animateCardOpacity
          swipeBackCard
          verticalSwipe={false}
          cardVerticalMargin={0}
          cardHorizontalMargin={0}
          overlayLabels={{
            left: {
              title: 'NOPE',
              style: {
                label: {
                  backgroundColor: '#FF6F3C',
                  color: 'white',
                  fontSize: 24
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: -30
                }
              }
            },
            right: {
              title: 'LIKE',
              style: {
                label: {
                  backgroundColor: '#50A6A7',
                  color: 'white',
                  fontSize: 24
                },
                wrapper: {
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-start',
                  marginTop: 30,
                  marginLeft: 30
                }
              }
            }
          }}
        />

        <SwipeButtons
          className="absolute bottom-20 w-full z-10"
          onSwipe={handleSwipe}
          disabled={isLimited}
          currentUser={recommendations[currentIndex]}
          apiUrl={API_URL}
          confettiRef={confettiRef}
          updateSwipesRemaining={(remaining, total) => {
            setSwipesRemaining(remaining);
            setTotalLimit(total);
            setIsLimited(remaining <= 0);
          }}
        />

        <TouchableOpacity 
          onPress={refreshAll}
          className="absolute top-4 right-4 z-20 bg-white/20 p-2 rounded-full"
          style={{ right: 20 }}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>

        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: -10, y: 0 }}
          autoStart={false}
          fadeOut={true}
          colors={['#D6A655', '#50A6A7', '#7D5BA6', '#E6C489']}
        />
      </View>
    </SafeAreaView>
  );
} 