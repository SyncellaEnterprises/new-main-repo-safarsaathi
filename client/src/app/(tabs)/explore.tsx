import React, { useState, useRef } from 'react';
import { View, SafeAreaView, ScrollView } from 'react-native';
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

export default function ExploreScreen() {
  const router = useRouter();
  const swiperRef = useRef(null);
  const confettiRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { swipesLeft, timeUntilReset, isLimited, decrementSwipes } = useSwipeLimit(10);

  const handleSwipe = (direction: string) => {
    if (isLimited) {
      Toast.show({
        type: 'info',
        text1: 'Daily Limit Reached',
        text2: `Try again in ${timeUntilReset}`,
      });
      return;
    }

    decrementSwipes();
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
  };

  const handleRecommendations = async () => {
    const token = await AsyncStorage.getItem('token');
    console.log(token);
    if (!token) {
      console.log('No token found');
      return;
    }
    try {
      const recommendations = await axios.get(`${API_URL}/user/recommendations`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRecommendations(recommendations.data);
      console.log(recommendations.data);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#1a237e]">
      <TabHeader
        title="Explore"
        leftIcon="people-outline"
        rightIcon="filter-outline"
        onLeftPress={() => router.push("/connections")}
        onRightPress={() => router.push("/filters")}
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
            decrementSwipes();
          }}
          onSwipedRight={(cardIndex) => {
            console.log('Liked', cardIndex);
            decrementSwipes();
          }}
          onSwipedAll={() => console.log('No more cards!')}
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