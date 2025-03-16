import React, { useState, useRef, useEffect } from 'react';
import { View, SafeAreaView, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import Swiper from 'react-native-deck-swiper';
import ConfettiCannon from 'react-native-confetti-cannon';
import { UserCard } from '@/src/components/explore/UserCard';
import { SwipeButtons } from '@/src/components/explore/SwipeButtons';
import TabHeader from '@/src/components/shared/TabHeader';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useSwipeLimit } from '@/src/hooks/useSwipeLimit';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Explosion from 'react-native-confetti-cannon';
import { API_URL } from '@/src/constants/config';

interface RecommendationResponse {
  recommended_user_age: number;
  recommended_user_bio: string;
  recommended_user_created_at: string;
  recommended_user_gender: string;
  recommended_user_interest: string;
  recommended_user_location: string | null;
  recommended_user_occupation: string;
  recommended_user_photo: string | null;
  recommended_user_profile_id: number;
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

interface RecommendationIds {
  recommended_users: number[];
  similarity_scores: number[];
  status: string;
}

export default function ExploreScreen() {
  const router = useRouter();
  const swiperRef = useRef<Swiper<TransformedProfile>>(null);
  const confettiRef = useRef<Explosion>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { swipesLeft, timeUntilReset, isLimited, decrementSwipes } = useSwipeLimit(10);
  const [recommendations, setRecommendations] = useState<TransformedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
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
      const transformedProfiles = detailedResponse.data.recommended_users.map(
        (rec: RecommendationResponse) => {
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
          const interestsStr = rec.recommended_user_interest || '{}';
          const rawInterests = interestsStr.replace(/[{}]/g, '');
          const interests = rawInterests.split(',')
            .map(i => i.trim().replace(/^"|"$/g, ''))
            .filter(i => i);

          // Get similarity score from the map
          const similarity_score = profileMap.get(rec.recommended_user_profile_id) || 0;

          return {
            username: `User${rec.recommended_user_profile_id}`,
            age: rec.recommended_user_age,
            bio: rec.recommended_user_bio,
            gender: rec.recommended_user_gender,
            interests: interests,
            location: locationText,
            occupation: rec.recommended_user_occupation,
            profile_photo: rec.recommended_user_photo,
            prompts: rec.recommended_user_prompts || { prompts: [] },
            similarity_score: similarity_score,
            recommended_user_profile_id: rec.recommended_user_profile_id
          };
        }
      );

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

  const handleSwipe = async (direction: string) => {
    if (isLimited) {
      Toast.show({
        type: 'info',
        text1: 'Daily Limit Reached',
        text2: `Try again in ${timeUntilReset}`,
      });
      return;
    }

    try {
      const currentUser = recommendations[currentIndex];
      if (!currentUser) return;

      const token = await AsyncStorage.getItem('accessToken');
      if (!token) throw new Error('No access token found');

      // Record the swipe
      console.log('Making swipe request:', {
        target_profile_id: currentUser.recommended_user_profile_id,
        direction: direction === 'right' ? 'right' : 'left'
      });

      await axios.post(
        `${API_URL}/api/swipe`,
        {
          target_profile_id: currentUser.recommended_user_profile_id,
          direction: direction === 'right' ? 'right' : 'left'
        },
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      decrementSwipes();

      // If it's a right swipe, check for a match
      if (direction === 'right') {
        const matchResponse = await axios.get(
          `${API_URL}/api/matches`,
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('Match response:', matchResponse.data);

        const isMatch = matchResponse.data.matches.some(
          (match: any) => match.matched_profile_id === currentUser.recommended_user_profile_id
        );

        if (isMatch) {
          confettiRef.current?.start();
          Toast.show({
            type: 'success',
            text1: 'It\'s a Match! 🎉',
            text2: `You matched with ${currentUser.username}!`
          });
        }
      }

      // Trigger the swipe animation
      switch (direction) {
        case 'left':
          swiperRef.current?.swipeLeft();
          break;
        case 'right':
          swiperRef.current?.swipeRight();
          break;
        case 'superlike':
          confettiRef.current?.start();
          swiperRef.current?.swipeRight();
          break;
      }
    } catch (error: any) {
      console.error('Error in handleSwipe:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to process swipe'
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#1a237e]">
        <TabHeader
          title="Explore"
          leftIcon="people-outline"
          rightIcon="filter-outline"
          onLeftPress={() => router.push("/(tabs)/connections" as any)}
          onRightPress={() => router.push("/(tabs)/filters" as any)}
          gradientColors={['#1a237e', '#283593']}
        />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#fff" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || recommendations.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-[#1a237e]">
        <TabHeader
          title="Explore"
          leftIcon="people-outline"
          rightIcon="filter-outline"
          onLeftPress={() => router.push("/(tabs)/connections" as any)}
          onRightPress={() => router.push("/(tabs)/filters" as any)}
          gradientColors={['#1a237e', '#283593']}
        />
        <View className="flex-1 items-center justify-center p-6">
          <BlurView intensity={20} className="p-6 rounded-3xl items-center">
            <Ionicons name="search" size={48} color="#fff" />
            <Text className="text-white text-xl font-semibold mt-4 text-center">
              {error || 'No recommendations found'}
            </Text>
            <TouchableOpacity 
              onPress={fetchRecommendations}
              className="mt-6 bg-white/20 px-6 py-3 rounded-xl"
            >
              <Text className="text-white font-semibold">Try Again</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#1a237e]">
      <TabHeader
        title="Explore"
        leftIcon="people-outline"
        rightIcon="filter-outline"
        onLeftPress={() => router.push("/(tabs)/connections" as any)}
        onRightPress={() => router.push("/(tabs)/filters" as any)}
        gradientColors={['#1a237e', '#283593']}
        subtitle={isLimited ? `Reset in ${timeUntilReset}` : `${swipesLeft} swipes left`}
      />

      <View className="flex-1">
        <Swiper
          ref={swiperRef}
          cards={recommendations}
          renderCard={(user) => <UserCard user={user} />}
          onSwipedLeft={(cardIndex) => {
            console.log('Disliked', cardIndex);
            handleSwipe('left');
          }}
          onSwipedRight={(cardIndex) => {
            console.log('Liked', cardIndex);
            handleSwipe('right');
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
                  backgroundColor: '#00BFA6',
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
        />

        <ConfettiCannon
          ref={confettiRef}
          count={200}
          origin={{ x: -10, y: 0 }}
          autoStart={false}
          fadeOut={true}
          colors={['#FF6F3C', '#E100FF', '#00BFA6', '#FFD8C2']}
        />
      </View>
    </SafeAreaView>
  );
} 