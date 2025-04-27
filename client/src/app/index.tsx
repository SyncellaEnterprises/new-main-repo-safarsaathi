import { useEffect, useState } from "react";
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React from "react";

export default function SplashScreen() {
  const router = useRouter();
  const { isTokenValid, signOut } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  // Handle unauthorized responses globally
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid, handle logout
          try {
            await signOut();
            router.replace("/auth");
          } catch (logoutError) {
            console.error("Logout error:", logoutError);
            // Force navigation to auth screen even if logout fails
            router.replace("/auth");
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor on unmount
    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      try {
        // Start animations
        scale.value = withSpring(1);
        opacity.value = withTiming(1, { duration: 1000 });

        // Wait for minimum splash duration
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Check token validity using your existing method
        const valid = await isTokenValid();
        
        if (!valid) {
          // If token is invalid or doesn't exist, sign out and go to auth
          await signOut();
          router.replace("/auth");
        } else {
          // If token is valid, go to home
          router.replace("/(tabs)/home");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // On error, safely sign out and redirect to auth
        await signOut();
        router.replace("/auth");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndNavigate();

    // Cleanup function
    return () => {
      // Reset animation values
      scale.value = 0;
      opacity.value = 0;
    };
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
