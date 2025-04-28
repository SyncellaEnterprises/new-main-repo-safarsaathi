import { useEffect, useState } from "react";
import { View, Image, ImageBackground, StatusBar } from "react-native";
import { useRouter, Redirect} from "expo-router";
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withSequence,
  withDelay,
  useSharedValue,
  interpolate,
  Extrapolate,
  FadeIn,
  ZoomIn
} from "react-native-reanimated";
import IMAGES from "@/src/constants/images";
import { useAuth } from "@/src/context/AuthContext";
import React from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

export default function SplashScreen() {
  const router = useRouter();
  const { isTokenValid, signOut } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  
  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(0);
  const translateY = useSharedValue(50);

  // Logo animation style
  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` }
    ],
    opacity: opacity.value,
  }));

  // Background circle animation
  const circleScale = useSharedValue(0);
  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
    opacity: interpolate(circleScale.value, [0, 0.5, 1], [0, 0.2, 0.15]),
  }));

  useEffect(() => {
    const checkAuthAndNavigate = async () => {
      try {
        // Start complex animation sequence
        scale.value = withSequence(
          withTiming(0.8, { duration: 400 }),
          withSpring(1, { damping: 8 })
        );
        
        opacity.value = withTiming(1, { duration: 800 });
        
        rotate.value = withSequence(
          withTiming(-10, { duration: 200 }),
          withTiming(10, { duration: 200 }),
          withTiming(0, { duration: 200 })
        );
        
        translateY.value = withSequence(
          withTiming(0, { duration: 1000 }),
          withSpring(-10, { damping: 3 }),
          withSpring(0, { damping: 4 })
        );

        circleScale.value = withDelay(
          200,
          withTiming(1, { duration: 1000 })
        );

        // Wait for minimum splash duration
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Check token validity
        const valid = await isTokenValid();
        
        if (!valid) {
          await signOut();
          router.replace("/auth");
        } else {
          router.replace("/(tabs)/home");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        await signOut();
        router.replace("/auth");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkAuthAndNavigate();

    return () => {
      scale.value = 0;
      opacity.value = 0;
      rotate.value = 0;
      translateY.value = 50;
      circleScale.value = 0;
    };
  }, []);

  if (isCheckingAuth) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <StatusBar barStyle="light-content" />
        
        {/* Animated background circles */}
        <Animated.View 
          style={[circleStyle, {
            position: 'absolute',
            width: 600,
            height: 600,
            borderRadius: 300,
            backgroundColor: '#FF8FB1',
          }]}
        />
        
        <MotiView
          from={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true
          }}
          className="absolute"
        >
          <LinearGradient
            colors={['rgba(255,143,177,0.2)', 'rgba(255,107,107,0.1)']}
            className="w-80 h-80 rounded-full"
          />
        </MotiView>

        {/* Logo container */}
        <Animated.View style={logoStyle} className="items-center">
          <Image
            source={IMAGES.safarsaathi}
            className="w-40 h-40"
            resizeMode="contain"
          />
          
          <Animated.Text 
            entering={FadeIn.delay(600).springify()}
            className="mt-6 text-2xl font-youngSerif text-primary"
          >
            SafarSaathi
          </Animated.Text>
          
          <Animated.Text 
            entering={FadeIn.delay(800).springify()}
            className="mt-2 text-neutral-dark font-montserrat text-center px-8"
          >
            Your trusted companion for safe travels
          </Animated.Text>
        </Animated.View>

        {/* Loading indicator */}
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'timing',
            duration: 1000,
            loop: true
          }}
          className="mt-12"
        >
          <LinearGradient
            colors={['#FF8FB1', '#FF6B6B']}
            className="w-16 h-16 rounded-full items-center justify-center"
          >
            <View className="w-12 h-12 rounded-full border-4 border-white" />
          </LinearGradient>
        </MotiView>
      </View>
    );
  }

  return <Redirect href="/auth" />;
}
