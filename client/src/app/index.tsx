import { useEffect } from "react";
import { View, Image } from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  useSharedValue
} from "react-native-reanimated";
import IMAGES from "@/src/constants/images";
import React from "react";

export default function SplashScreen() {
  const router = useRouter();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    scale.value = withSpring(1);
    opacity.value = withTiming(1, { duration: 1000 });

    // Navigate to auth screen after 2.5 seconds
    const timer = setTimeout(() => {
      router.replace("/auth");
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View className="flex-1 bg-primary justify-center items-center">
      <Animated.View style={animatedStyle}>
        <Image 
          source={IMAGES.logo} 
          className="w-70 h-70"
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}
