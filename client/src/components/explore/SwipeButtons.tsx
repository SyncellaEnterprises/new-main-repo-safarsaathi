import React from 'react';
import { View, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
  withSequence
} from 'react-native-reanimated';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface SwipeButtonsProps {
  onSwipe: (direction: string) => void;
  className?: string;
}

export function SwipeButtons({ onSwipe, className }: SwipeButtonsProps) {
  // Animation values for each button
  const scaleClose = useSharedValue(1);
  const scaleStar = useSharedValue(1);
  const scaleHeart = useSharedValue(1);

  // Reusable animation function
  const animatePress = (scale: Animated.SharedValue<number>) => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 10 }),
      withSpring(1.1, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );
  };

  // Animated styles for each button
  const closeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleClose.value }]
  }));

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleStar.value }]
  }));

  const heartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleHeart.value }]
  }));

  return (
    <View className={`flex-row justify-evenly items-center w-full px-8 py-4 ${className}`}>
      {/* Nope Button */}
      <AnimatedTouchable 
        style={closeStyle}
        className="w-16 h-16 rounded-full bg-white shadow-lg shadow-red-500/50 
                  items-center justify-center border-2 border-red-500"
        onPress={() => {
          animatePress(scaleClose);
          onSwipe('left');
        }}
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
        onPress={() => {
          animatePress(scaleStar);
          onSwipe('superlike');
        }}
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
        onPress={() => {
          animatePress(scaleHeart);
          onSwipe('right');
        }}
      >
        <View className="items-center justify-center">
          <Ionicons name="heart" size={32} color="#34C759" />
        </View>
      </AnimatedTouchable>
    </View>
  );
}
