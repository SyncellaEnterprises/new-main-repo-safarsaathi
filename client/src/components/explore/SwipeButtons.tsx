import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withSequence,
  useSharedValue,
  withTiming,
  Easing
} from 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface SwipeResponse {
  remaining_swipes: number;
  total_limit: number;
  status: string;
}

interface Match {
  is_active: boolean;
  match_id: number;
  matched_at: string;
  matched_interests: string;
  matched_location: string;
  matched_user_id: number;
  matched_username: string;
}

interface MatchResponse {
  matches: Match[];
  status: string;
}

interface SwipeButtonsProps {
  onSwipe: (direction: string) => void;
  className?: string;
  disabled?: boolean;
  currentUser?: any;
  apiUrl: string;
  confettiRef: React.RefObject<any>;
  updateSwipesRemaining: (remaining: number, total: number) => void;
}

export function SwipeButtons({ 
  onSwipe, 
  className, 
  disabled = false, 
  currentUser,
  apiUrl,
  confettiRef,
  updateSwipesRemaining
}: SwipeButtonsProps) {
  // Animation values for each button
  const scaleClose = useSharedValue(1);
  const scaleStar = useSharedValue(1);
  const scaleHeart = useSharedValue(1);

  // Reusable animation function with haptic feedback
  const animatePress = (scale: Animated.SharedValue<number>) => {
    scale.value = withSequence(
      withTiming(0.9, { duration: 100, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
      withTiming(1.1, { duration: 100, easing: Easing.bezier(0.25, 0.1, 0.25, 1) }),
      withTiming(1, { duration: 100, easing: Easing.bezier(0.25, 0.1, 0.25, 1) })
    );
  };

  // Animated styles for each button
  const closeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleClose.value }],
    opacity: disabled || !currentUser ? 0.5 : 1
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleStar.value }],
    opacity: disabled || !currentUser ? 0.5 : 1
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleHeart.value }],
    opacity: disabled || !currentUser ? 0.5 : 1
  }));

  const handleSwipe = async (direction: string) => {
    // Early validation checks
    if (!currentUser?.username) {
      Toast.show({ type: 'error', text1: 'Invalid Profile', text2: 'Cannot swipe on this profile' });
      return;
    }

    if (disabled || !currentUser) {
      if (!currentUser) {
        Toast.show({ type: 'info', text1: 'No more profiles', text2: 'Check back later!' });
      }
      return;
    }

    // Trigger button animation based on direction
    switch (direction) {
      case 'left':
        animatePress(scaleClose);
        break;
      case 'superlike':
        animatePress(scaleStar);
        break;
      case 'right':
        animatePress(scaleHeart);
        break;
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) throw new Error('No access token found');

      const targetUsername = currentUser.username;
      
      console.log('Target username for swipe:', targetUsername);

      // Prepare API payload
      const apiPayload = {
        target_username: targetUsername,
        direction: direction === 'right' ? 'right' : 'left'
      };

      console.log('Sending swipe request with payload:', apiPayload);

      // Send swipe request
      const swipeResponse = await axios.post<SwipeResponse>(
        `${apiUrl}/api/swipe`,
        apiPayload,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      console.log('Swipe response:', swipeResponse.data);

      // Update swipes remaining
      if (swipeResponse.data.status === 'success') {
        updateSwipesRemaining(
          swipeResponse.data.remaining_swipes,
          swipeResponse.data.total_limit
        );
      }

      // Check for matches only after successful right swipe
      if ((direction === 'right' || direction === 'superlike') && swipeResponse.data.status === 'success') {
        try {
          console.log('Checking for match...');
          const matchResponse = await axios.get<MatchResponse>(
            `${apiUrl}/api/matches/me`,
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('Match response:', matchResponse.data);

          if (matchResponse.data?.matches?.length > 0) {
            // Check if the current user is in the matches
            const isMatch = matchResponse.data.matches.some(
              (match: Match) => match.matched_username === currentUser.username
            );

            if (isMatch) {
              console.log('It\'s a match!', currentUser.username);
              // Trigger confetti animation
              confettiRef.current?.start();
              
              Toast.show({
                type: 'success',
                text1: 'Match! 🎉',
                text2: `You matched with ${currentUser.username}!`,
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

      // Only trigger UI swipe after successful API call
      onSwipe(direction);

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
      
      // Do NOT call onSwipe() here to prevent UI mismatch
    }
  };

  return (
    <View className={`flex-row justify-evenly items-center w-full px-8 py-4 ${className}`}>
      {/* Nope Button */}
      <AnimatedTouchable 
        style={closeStyle}
        className="w-16 h-16 rounded-full bg-neutral-lightest shadow-lg 
                  items-center justify-center border-2 border-red-500"
        onPress={() => handleSwipe('left')}
        disabled={disabled || !currentUser}
      >
        <View className="items-center justify-center">
          <Ionicons name="close" size={32} color="#FF3B30" />
        </View>
      </AnimatedTouchable>

      {/* Super Like Button */}
      <AnimatedTouchable 
        style={starStyle}
        className="w-20 h-20 rounded-full shadow-lg 
                  items-center justify-center border-2 border-primary elevation-5"
        onPress={() => handleSwipe('superlike')}
        disabled={disabled || !currentUser}
      >
        <View className="items-center justify-center">
          <Ionicons name="star" size={40} color="#7D5BA6" />
        </View>
      </AnimatedTouchable>

      {/* Like Button */}
      <AnimatedTouchable 
        style={heartStyle}
        className="w-16 h-16 rounded-full bg-neutral-lightest shadow-lg 
                  items-center justify-center border-2 border-secondary"
        onPress={() => handleSwipe('right')}
        disabled={disabled || !currentUser}
      >
        <View className="items-center justify-center">
          <Ionicons name="heart" size={32} color="#50A6A7" />
        </View>
      </AnimatedTouchable>
    </View>
  );
}