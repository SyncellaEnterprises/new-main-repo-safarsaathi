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
import { useAuth } from "@/src/context/AuthContext";
import React from "react";

export default function SplashScreen() {
  const router = useRouter();
  const { isTokenValid, isLoading } = useAuth();
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      scale.value = withSpring(1);
      opacity.value = withTiming(1, { duration: 1000 });

      // Wait for minimum splash screen duration
      await new Promise(resolve => setTimeout(resolve, 1500));

      try {
        // Check if token is valid
        const valid = await isTokenValid();
        
        // Navigate based on auth status
        if (valid) {
          router.replace("/(tabs)/home");
        } else {
          router.replace("/auth");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        router.replace("/auth");
      }
    };

    checkAuthAndNavigate();
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
