import React from 'react';
import { View, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
  withSequence,
  withTiming,
  Easing
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface SwipeButtonsProps {
  onSwipe: (direction: string) => void;
  className?: string;
  disabled?: boolean;
}

export function SwipeButtons({ onSwipe, className, disabled = false }: SwipeButtonsProps) {
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
    opacity: disabled ? 0.5 : 1
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleStar.value }],
    opacity: disabled ? 0.5 : 1
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleHeart.value }],
    opacity: disabled ? 0.5 : 1
  }));

  const handleSwipe = (direction: string) => {
    if (disabled) return;
    
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
    onSwipe(direction);
  };

  return (
    <View className={`flex-row justify-evenly items-center w-full px-8 py-4 ${className}`}>
      {/* Nope Button */}
      <AnimatedTouchable 
        style={closeStyle}
        className="w-16 h-16 rounded-full bg-white shadow-lg shadow-red-500/50 
                  items-center justify-center border-2 border-red-500"
        onPress={() => handleSwipe('left')}
        disabled={disabled}
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
        disabled={disabled}
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
        disabled={disabled}
      >
        <View className="items-center justify-center">
          <Ionicons name="heart" size={32} color="#34C759" />
        </View>
      </AnimatedTouchable>
    </View>
  );
}
