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
import { API_URL } from '@/src/constants/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import type { Explosion } from 'react-native-confetti-cannon';

interface Recommendation {
  username: string;
  city: string;
  interests: string;
  similarity_score: number;
  // Additional fields from user profile
  age?: number;
  bio?: string;
  gender?: string;
  occupation?: string;
  profile_photo?: string | null;
  prompts?: {
    prompts: Array<{
      question: string;
      answer: string;
    }>;
  };
}

interface SwiperRef {
  swipeLeft: () => void;
  swipeRight: () => void;
}

interface ConfettiRef {
  start: () => void;
}

export default function ExploreScreen() {
  const router = useRouter();
  const swiperRef = useRef<Swiper<Recommendation>>(null);
  const confettiRef = useRef<Explosion>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { swipesLeft, timeUntilReset, isLimited, decrementSwipes } = useSwipeLimit(10);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
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

      const response = await axios.get(`${API_URL}/user/recommendations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.recommendations) {
        // Fetch detailed profile for each recommendation
        const detailedProfiles = await Promise.all(
          response.data.recommendations.map(async (rec: Recommendation) => {
            try {
              const userResponse = await axios.get(`${API_URL}/users/${rec.username}`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return {
                ...rec,
                ...userResponse.data.user
              };
            } catch (error) {
              console.error(`Error fetching profile for ${rec.username}:`, error);
              return rec;
            }
          })
        );
        setRecommendations(detailedProfiles);
      }
    } catch (error: any) {
      setError(error.message || 'Failed to fetch recommendations');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: error.message || 'Failed to fetch recommendations'
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
      await axios.post(`${API_URL}/swipe`, {
        target_username: currentUser.username,
        direction: direction === 'right' ? 'right' : 'left'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      decrementSwipes();

      // If it's a right swipe, check for a match
      if (direction === 'right') {
        const matchResponse = await axios.get(`${API_URL}/matches`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const isMatch = matchResponse.data.matches.some(
          (match: any) => match.matched_username === currentUser.username
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
          onLeftPress={() => router.push({
            pathname: "/(icon)/connections"
          })}
          onRightPress={() => router.push({
            pathname: "/(icon)/filters"
          })}
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
          onLeftPress={() => router.push({
            pathname: "/(icon)/connections"
          })}
          onRightPress={() => router.push({
            pathname: "/(icon)/filters"
          })}
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
        onLeftPress={() => router.push({
          pathname: "/(icon)/connections"
        })}
        onRightPress={() => router.push({
          pathname: "/(icon)/filters"
        })}
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