import { useEffect, useState, useRef } from "react";
import { View, Image, StatusBar, Dimensions } from "react-native";
import { useRouter, Redirect } from "expo-router";
import Animated, { 
  useAnimatedStyle, 
  withTiming,
  withDelay,
  useSharedValue,
  interpolate,
  interpolateColor,
  Extrapolate,
  FadeIn,
  FadeInDown,
  withRepeat,
  withSequence,
} from "react-native-reanimated";
import IMAGES from "@/src/constants/images";
import { useAuth } from "@/src/context/AuthContext";
import React from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');

// Create array of floating elements - reduced from 6 to 4
const FLOATING_ELEMENTS = [
  { icon: 'map-pin', color: '#7D5BA6', size: 28, x: -100, y: -120, delay: 300 },
  { icon: 'compass', color: '#50A6A7', size: 24, x: 100, y: -80, delay: 600 },
  { icon: 'users', color: '#7D5BA6', size: 22, x: -80, y: 120, delay: 450 },
  { icon: 'message-circle', color: '#50A6A7', size: 26, x: 90, y: 90, delay: 900 },
];

export default function SplashScreen() {
  const router = useRouter();
  const { isTokenValid, signOut } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  // Lottie refs
  const airplaneRef = useRef<LottieView>(null);
  const particlesRef = useRef<LottieView>(null);
  
  // Animation values for main logo
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);
  
  // New animation values
  const ringScale = useSharedValue(0.8);
  const ringOpacity = useSharedValue(0);
  const loadingProgress = useSharedValue(0);
  const loadingWidth = useSharedValue(0);
  
  // Glow effect
  const glowOpacity = useSharedValue(0.4);
  const glowScale = useSharedValue(1);
  
  // Shimmer effect for loading bar
  const shimmerPosition = useSharedValue(0);
  
  // Background animations
  const backgroundOpacity = useSharedValue(0);
  
  // Logo animation style
  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value }
    ],
    opacity: opacity.value,
  }));

  // Background animation
  const bgStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value,
  }));
  
  // Ring pulse animation
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
    opacity: ringOpacity.value,
  }));
  
  // Glow animation
  const glowStyle = useAnimatedStyle(() => ({
    transform: [{ scale: glowScale.value }],
    opacity: glowOpacity.value,
  }));
  
  // Loading bar animation
  const loadingBarStyle = useAnimatedStyle(() => ({
    width: `${loadingProgress.value * 100}%`,
  }));
  
  const loadingContainerStyle = useAnimatedStyle(() => ({
    opacity: loadingWidth.value,
    transform: [{ scaleX: loadingWidth.value }],
  }));
  
  // Shimmer effect
  const shimmerStyle = useAnimatedStyle(() => ({
    left: `${shimmerPosition.value * 100}%`,
  }));

  // Handle successful image loading
  const handleImageLoaded = () => {
    setIsImageLoaded(true);
  };

  useEffect(() => {
    // Start Lottie animations
    if (airplaneRef.current) {
      airplaneRef.current.play();
    }
    
    if (particlesRef.current) {
      particlesRef.current.play();
    }
    
    const checkAuthAndNavigate = async () => {
      try {
        // Start simplified animation sequence
        
        // Background fade in
        backgroundOpacity.value = withTiming(1, { duration: 800 });
        
        // Only start main animations after image loads or timeout
        if (isImageLoaded) {
          // Main logo animation - simplified
          scale.value = withTiming(1, { duration: 600 });
          opacity.value = withTiming(1, { duration: 600 });
          translateY.value = withTiming(-40, { duration: 800 }); 
          
          // Ring animation - simplified
          ringScale.value = withTiming(1, { duration: 1000 });
          ringOpacity.value = withTiming(0.6, { duration: 800 });
          
          // Glow animation
          glowOpacity.value = withDelay(400, withRepeat(
            withSequence(
              withTiming(0.7, { duration: 1500 }),
              withTiming(0.4, { duration: 1500 })
            ),
            -1,
            true
          ));
          
          glowScale.value = withDelay(400, withRepeat(
            withSequence(
              withTiming(1.1, { duration: 1800 }),
              withTiming(1, { duration: 1800 })
            ),
            -1,
            true
          ));
          
          // Loading bar animation
          loadingWidth.value = withTiming(1, { duration: 500 });
          loadingProgress.value = withTiming(1, { duration: 2200 });
          
          // Shimmer effect
          shimmerPosition.value = withRepeat(
            withTiming(1, { duration: 2000 }),
            -1,
            false
          );
        }

        // Check token validity
        const valid = await isTokenValid();
        
        // Wait for minimum splash duration
        await new Promise(resolve => setTimeout(resolve, 2500));
        
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

    // Failsafe: if image doesn't load in 1.5 seconds, continue anyway
    const timeout = setTimeout(() => {
      if (!isImageLoaded) {
        setIsImageLoaded(true);
      }
    }, 1500);

    return () => {
      // Reset all animations
      clearTimeout(timeout);
      scale.value = 0;
      opacity.value = 0;
      translateY.value = 30;
      ringScale.value = 0.8;
      ringOpacity.value = 0;
      glowOpacity.value = 0.4;
      glowScale.value = 1;
      loadingProgress.value = 0;
      loadingWidth.value = 0;
      backgroundOpacity.value = 0;
      shimmerPosition.value = 0;
    };
  }, [isImageLoaded]);

  if (isCheckingAuth) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#0F172A',
        justifyContent: 'space-between',
        paddingTop: 80,
        paddingBottom: 60
      }}>
        <StatusBar barStyle="light-content" />
        
        {/* Background gradient */}
        <Animated.View 
          style={[bgStyle, { position: 'absolute', width: '100%', height: '100%' }]}
        >
          <LinearGradient
            colors={['#1E293B', '#0F172A', '#020617']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: '100%', height: '100%' }}
          />
        </Animated.View>
        
        {/* Particles animation in the background */}
        {/* <LottieView
          ref={particlesRef}
          source={require('@/assets/lottie/particle-animation.json')}
          style={{
            position: 'absolute',
            width: width,
            height: height,
            opacity: 0.4,
          }}
          loop
          speed={0.5}
        /> */}
        
        {/* Top area - can be empty for balance */}
        <View style={{ height: 20 }} />

        {/* Main content area */}
        <View style={{ 
          alignItems: 'center',
          position: 'relative',
          height: height * 0.6,
          justifyContent: 'flex-start'
        }}>
          {/* Outer glow */}
          <Animated.View 
            style={[
              glowStyle, 
              {
                position: 'absolute',
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: 'rgba(125, 91, 166, 0.15)',
                top: 20,
                alignItems: 'center',
                justifyContent: 'center',
              }
            ]}
          />
          
          {/* Pulsing ring */}
          <Animated.View style={[ringStyle, { marginTop: 40 }]}>
            <LinearGradient
              colors={['#7D5BA6', '#50A6A7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 160,
                height: 160,
                borderRadius: 80,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.3,
              }}
            />
          </Animated.View>

          {/* Logo container */}
          <Animated.View style={[logoStyle, { 
            alignItems: 'center',
            position: 'absolute',
            top: 60,
            zIndex: 10,
          }]}>
            <LinearGradient
              colors={['rgba(125, 91, 166, 0.7)', 'rgba(80, 166, 167, 0.7)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: 140,
                height: 140,
                borderRadius: 70,
                alignItems: 'center',
                justifyContent: 'center',
                padding: 5,
              }}
            >
              <View style={{ 
                width: 130, 
                height: 130, 
                borderRadius: 65, 
                backgroundColor: '#fff',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}>
                <Image
                  source={IMAGES.safarsaathi}
                  style={{ width: 120, height: 120 }}
                  resizeMode="contain"
                  onLoad={handleImageLoaded}
                />
              </View>
            </LinearGradient>
          </Animated.View>
          
          {/* Airplane animation */}
          <LottieView
            ref={airplaneRef}
            source={require('@/assets/lottie/airplane-animation.json')}
            style={{
              width: 500,
              height: 500,
              position: 'absolute',
              top: 0,
              zIndex: 1,
            }}
            loop
            speed={0.7}
          />
        </View>
        
        {/* Bottom section */}
        <View style={{ alignItems: 'center' }}>
          {/* Loading bar */}
          <Animated.View 
            style={[loadingContainerStyle, { 
              width: 280, 
              height: 3, 
              backgroundColor: 'rgba(255, 255, 255, 0.12)', 
              borderRadius: 1.5, 
              overflow: 'hidden', 
              marginBottom: 50,
              position: 'relative',
            }]}
          >
            <Animated.View
              style={[loadingBarStyle, { height: '100%', borderRadius: 1.5 }]}
            >
              <LinearGradient
                colors={['#7D5BA6', '#50A6A7']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ width: '100%', height: '100%' }}
              />
            </Animated.View>
            
            {/* Shimmer effect */}
            <Animated.View
              style={[
                shimmerStyle,
                {
                  position: 'absolute',
                  top: 0,
                  width: 40,
                  height: '100%',
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: 1.5,
                  zIndex: 2,
                }
              ]}
            />
          </Animated.View>
          
          {/* Travel icons at the bottom */}
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'center',
            alignItems: 'center',
            gap: 32,
          }}>
            {['map-pin', 'compass', 'briefcase', 'sun'].map((icon, index) => (
              <Animated.View 
                key={index}
                entering={FadeInDown.delay(300 + index * 100).springify()}
              >
                <LinearGradient
                  colors={['rgba(125, 91, 166, 0.15)', 'rgba(80, 166, 167, 0.15)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    padding: 1,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <View style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}>
                    <Feather name={icon as any} size={20} color="#fff" />
                  </View>
                </LinearGradient>
              </Animated.View>
            ))}
          </View>
        </View>
      </View>
    );
  }

  return <Redirect href="/auth" />;
}
