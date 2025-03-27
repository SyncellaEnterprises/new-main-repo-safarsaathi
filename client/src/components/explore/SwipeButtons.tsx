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
    // Check both disabled state and if there's a current user
    if (disabled || !currentUser) {
      if (!currentUser) {
        Toast.show({
          type: 'info',
          text1: 'No more profiles',
          text2: 'Check back later for more recommendations!'
        });
      }
      return;
    }
    
    // Animate the button press
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

      // Record the swipe with correct payload format
      const apiPayload = {
        target_username: currentUser.username,
        direction: direction === 'right' || direction === 'superlike' ? 'right' : 'left'
      };

      console.log('Making swipe request:', apiPayload);

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

      // Update remaining swipes from response
      if (swipeResponse.data.status === 'success') {
        updateSwipesRemaining(
          swipeResponse.data.remaining_swipes,
          swipeResponse.data.total_limit
        );
      }

      // If it's a right swipe, check for a match
      if (direction === 'right' || direction === 'superlike') {
        try {
          const matchResponse = await axios.post(
            `${apiUrl}/api/matches`,
            {},
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          console.log('Match response:', matchResponse.data);

          // Check if the match data is valid and contains matches
          if (matchResponse.data && matchResponse.data.matches) {
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
        } catch (matchError: any) {
          console.error('Error checking for match:', matchError);
          // Don't show error toast for match check - just log it
        }
      }

      // Call the onSwipe function to trigger the animation in the parent component
      onSwipe(direction);
      
    } catch (error: any) {
      console.error('Error in handleSwipe:', error.response || error);
      
      // Get a more detailed error message
      const errorMessage = error.response?.data?.message || 
                         error.response?.status === 404 ? 'API endpoint not found (404)' :
                         error.message || 'Failed to process swipe';
      
      Toast.show({
        type: 'error',
        text1: 'Swipe Error',
        text2: errorMessage
      });
      
      // Still call onSwipe to advance the card
      onSwipe(direction);
    }
  };

  return (
    <View className={`flex-row justify-evenly items-center w-full px-8 py-4 ${className}`}>
      {/* Nope Button */}
      <AnimatedTouchable 
        style={closeStyle}
        className="w-16 h-16 rounded-full bg-white shadow-lg shadow-red-500/50 
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
        className="w-20 h-20 rounded-full shadow-lg shadow-purple-500/50 
                  items-center justify-center border-2 border-purple-500 elevation-5"
        onPress={() => handleSwipe('superlike')}
        disabled={disabled || !currentUser}
      >
        <View className="items-center justify-center">
          <Ionicons name="star" size={40} color="#9D3FFF" />
        </View>
      </AnimatedTouchable>

      {/* Like Button */}
      <AnimatedTouchable 
        style={heartStyle}
        className="w-16 h-16 rounded-full bg-white shadow-lg shadow-green-500/50 
                  items-center justify-center border-2 border-green-500"
        onPress={() => handleSwipe('right')}
        disabled={disabled || !currentUser}
      >
        <View className="items-center justify-center">
          <Ionicons name="heart" size={32} color="#34C759" />
        </View>
      </AnimatedTouchable>
    </View>
  );
}
