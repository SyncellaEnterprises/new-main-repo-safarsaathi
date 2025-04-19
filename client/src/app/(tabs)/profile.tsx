import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator, SafeAreaView, ScrollView, RefreshControl, Dimensions, Animated as RNAnimated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  SlideInDown,
  withSpring,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

// Set API URL based on platform and environment
const API_URL = __DEV__ 
  ? Platform.select({
    ios: 'http://localhost:5000/api',
    android: 'http://10.0.2.2:5000/api',
  })
  : 'https://your-production-api.com/api';

// User profile interface
interface UserProfile {
  username: string;
  user_id: number;
  email: string;
  age?: number;
  bio?: string;
  created_at?: string;
  gender?: string;
  interest?: string[] | string;
  location?: string;
  occupation?: string;
  profile_photo?: string | null;
  prompts?: {
    prompts: Array<{
      question: string;
      answer: string;
    }>;
  };
}

const SNAP_POINTS = [-height + 100, -height / 1.5, -height / 3];

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  // Animation values
  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });
  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);

  // Gesture handler for bottom sheet
  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
      translateY.value = Math.max(SNAP_POINTS[0], Math.min(0, translateY.value));
    })
    .onEnd((event) => {
      const velocity = event.velocityY;
      const shouldSnap = Math.abs(velocity) > 500;
      
      if (shouldSnap) {
        if (velocity > 0) {
          // Swiping down
          translateY.value = withSpring(0);
          setSelectedSection(null);
        } else {
          // Swiping up
          translateY.value = withSpring(SNAP_POINTS[0]);
        }
      } else {
        // Find nearest snap point
        const currentPosition = translateY.value;
        const nearestSnap = SNAP_POINTS.reduce((prev, curr) => 
          Math.abs(curr - currentPosition) < Math.abs(prev - currentPosition) ? curr : prev
        );
        translateY.value = withSpring(nearestSnap);
      }
    });

  // Animated styles
  const bottomSheetStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      translateY.value,
      [SNAP_POINTS[0], 0],
      [25, 25],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY: translateY.value }],
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: headerOpacity.value,
    };
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await axios.get(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        setProfile(response.data.user);
      } else {
        throw new Error('Failed to fetch profile data');
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, []);

  // Process interests to get count
  const getInterestCount = () => {
    if (!profile?.interest) return 0;
    if (Array.isArray(profile.interest)) return profile.interest.length;
    // If it's a string (comma-separated), count the number of items
    return profile.interest.split(',').filter(item => item.trim().length > 0).length;
  };

  const openSection = (section: string) => {
    setSelectedSection(section);
    translateY.value = withSpring(SNAP_POINTS[0]);
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-neutral-light items-center justify-center">
        <LinearGradient
          colors={['#7C3AED', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-32 h-32 rounded-3xl items-center justify-center"
        >
          <ActivityIndicator size="large" color="#fff" />
        </LinearGradient>
        <Animated.Text 
          entering={FadeInDown.delay(300).springify()} 
          className="mt-4 text-lg font-montserrat text-neutral-dark"
        >
          Loading your profile...
        </Animated.Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-neutral-light items-center justify-center p-4">
        <BlurView intensity={70} tint="light" className="p-8 rounded-3xl items-center">
          <Animated.View 
            entering={FadeIn.delay(300).springify()}
            className="items-center"
          >
            <Ionicons name="alert-circle" size={60} color="#EF4444" />
            <Text className="text-xl font-youngSerif text-neutral-darkest mt-4 text-center">{error}</Text>
            <TouchableOpacity 
              onPress={fetchProfile}
              className="mt-6 bg-primary px-8 py-3 rounded-2xl"
            >
              <Text className="text-white font-montserratMedium">Try Again</Text>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-light">
      {/* Animated Header */}
      <Animated.View style={headerStyle}>
        <LinearGradient
          colors={['#7C3AED', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-4 pt-12 pb-24"
        >
          <View className="flex-row items-center justify-between mb-6">
            <Text className="text-2xl text-white font-youngSerif">Profile</Text>
            <TouchableOpacity 
              onPress={() => router.push("/(profile)")}
              className="bg-white/20 p-2 rounded-full"
            >
              <Ionicons name="pencil" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView 
        className="flex-1 -mt-16"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#7C3AED"]} />
        }
        onScroll={(event) => {
          const scrollPosition = event.nativeEvent.contentOffset.y;
          headerOpacity.value = withTiming(scrollPosition > 50 ? 0 : 1);
        }}
        scrollEventThrottle={16}
      >
        <View className="px-4">
          {/* Profile Card */}
          <Animated.View 
            entering={FadeInDown.delay(300).springify()}
            className="bg-white rounded-3xl p-6 shadow-card"
          >
            <View className="items-center">
              {/* Profile Photo with Gradient Border */}
              <View className="relative">
                <LinearGradient
                  colors={['#7C3AED', '#06B6D4']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-32 h-32 rounded-full p-2"
                >
                  {profile?.profile_photo ? (
                    <Image
                      source={{ uri: profile.profile_photo }}
                      className="w-full h-full rounded-full border-4 border-white"
                      defaultSource={require('@/assets/images/avatar.png')}
                    />
                  ) : (
                    <View className="w-full h-full rounded-full bg-white items-center justify-center">
                      <Ionicons name="person" size={50} color="#7C3AED" />
                    </View>
                  )}
                </LinearGradient>
                <View className="absolute bottom-0 right-0 bg-secondary rounded-full w-10 h-10 items-center justify-center border-4 border-white">
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              </View>

              {/* User Info */}
              <Text className="text-2xl font-youngSerif text-neutral-darkest mt-4">
                {profile?.username || 'User'}
              </Text>
              
              {profile?.occupation && (
                <Text className="text-neutral-dark mt-1 font-montserrat">
                  {profile.occupation}
                </Text>
              )}
              
              {profile?.location && (
                <View className="flex-row items-center mt-2 bg-neutral-lightest px-4 py-2 rounded-full">
                  <Ionicons name="location" size={16} color="#7C3AED" />
                  <Text className="text-neutral-dark font-montserrat ml-1">
                    {profile.location}
                  </Text>
                </View>
              )}
            </View>

            {/* Stats Row with Gradient Cards */}
            <View className="flex-row justify-around mt-8">
              <TouchableOpacity 
                onPress={() => openSection('interests')}
                className="items-center"
              >
                <LinearGradient
                  colors={['rgba(124, 58, 237, 0.1)', 'rgba(6, 182, 212, 0.1)']}
                  className="w-20 h-20 rounded-2xl items-center justify-center"
                >
                  <Text className="text-2xl font-youngSerif text-primary">
                    {getInterestCount()}
                  </Text>
                  <Text className="text-neutral-dark font-montserrat text-sm mt-1">
                    Interests
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => openSection('matches')}
                className="items-center"
              >
                <LinearGradient
                  colors={['rgba(245, 158, 11, 0.1)', 'rgba(239, 68, 68, 0.1)']}
                  className="w-20 h-20 rounded-2xl items-center justify-center"
                >
                  <Text className="text-2xl font-youngSerif text-accent">
                    0
                  </Text>
                  <Text className="text-neutral-dark font-montserrat text-sm mt-1">
                    Matches
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => openSection('trips')}
                className="items-center"
              >
                <LinearGradient
                  colors={['rgba(16, 185, 129, 0.1)', 'rgba(6, 182, 212, 0.1)']}
                  className="w-20 h-20 rounded-2xl items-center justify-center"
                >
                  <Text className="text-2xl font-youngSerif text-success">
                    0
                  </Text>
                  <Text className="text-neutral-dark font-montserrat text-sm mt-1">
                    Trips
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* About Section */}
          <Animated.View 
            entering={FadeInDown.delay(400).springify()}
            className="mt-6 bg-white rounded-3xl p-6 shadow-card"
          >
            <View className="flex-row items-center mb-4">
              <LinearGradient
                colors={['#7C3AED', '#06B6D4']}
                className="w-10 h-10 rounded-xl items-center justify-center"
              >
                <Ionicons name="information-circle" size={20} color="white" />
              </LinearGradient>
              <Text className="text-lg font-montserratBold text-neutral-darkest ml-3">
                About Me
              </Text>
            </View>
            <Text className="text-neutral-dark leading-relaxed font-montserrat">
              {profile?.bio || 'No bio available. Tap the edit button to add more about yourself.'}
            </Text>
          </Animated.View>

          {/* Interests Section */}
          {profile?.interest && (
            <Animated.View 
              entering={FadeInDown.delay(500).springify()}
              className="mt-6 bg-white rounded-3xl p-6 shadow-card"
            >
              <View className="flex-row items-center mb-4">
                <LinearGradient
                  colors={['#7C3AED', '#06B6D4']}
                  className="w-10 h-10 rounded-xl items-center justify-center"
                >
                  <Ionicons name="heart" size={20} color="white" />
                </LinearGradient>
                <Text className="text-lg font-montserratBold text-neutral-darkest ml-3">
                  Interests
                </Text>
              </View>
              <View className="flex-row flex-wrap gap-2">
                {(Array.isArray(profile.interest) ? profile.interest : profile.interest.split(','))
                  .map((interest, index) => (
                    <Animated.View
                      key={index}
                      entering={FadeInDown.delay(600 + index * 100).springify()}
                    >
                      <LinearGradient
                        colors={['rgba(124, 58, 237, 0.1)', 'rgba(6, 182, 212, 0.1)']}
                        className="px-4 py-2 rounded-xl"
                      >
                        <Text className="text-primary font-montserratMedium">
                          {interest.trim()}
                        </Text>
                      </LinearGradient>
                    </Animated.View>
                  ))
                }
              </View>
            </Animated.View>
          )}

          {/* Prompts Section */}
          {profile?.prompts?.prompts && profile.prompts.prompts.length > 0 && (
            <Animated.View 
              entering={FadeInDown.delay(600).springify()}
              className="mt-6 bg-white rounded-3xl p-6 shadow-card mb-6"
            >
              <View className="flex-row items-center mb-4">
                <LinearGradient
                  colors={['#7C3AED', '#06B6D4']}
                  className="w-10 h-10 rounded-xl items-center justify-center"
                >
                  <Ionicons name="chatbubbles" size={20} color="white" />
                </LinearGradient>
                <Text className="text-lg font-montserratBold text-neutral-darkest ml-3">
                  Prompts
                </Text>
              </View>
              {profile.prompts.prompts.map((prompt, index) => (
                <Animated.View 
                  key={index} 
                  entering={FadeInDown.delay(700 + index * 100).springify()}
                  className="mb-4 last:mb-0"
                >
                  <Text className="text-primary font-montserratBold mb-1">
                    {prompt.question}
                  </Text>
                  <Text className="text-neutral-dark font-montserrat">
                    {prompt.answer}
                  </Text>
                </Animated.View>
              ))}
            </Animated.View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Sheet */}
      {selectedSection && (
        <GestureDetector gesture={gesture}>
          <Animated.View 
            style={[bottomSheetStyle]} 
            className="absolute left-0 right-0 bg-white h-screen shadow-lg"
          >
            <View className="items-center py-2">
              <View className="w-16 h-1 bg-neutral-medium rounded-full" />
            </View>
            <View className="p-6">
              <Text className="text-2xl font-youngSerif text-neutral-darkest mb-4">
                {selectedSection === 'interests' && 'Your Interests'}
                {selectedSection === 'matches' && 'Your Matches'}
                {selectedSection === 'trips' && 'Your Trips'}
              </Text>
              {/* Add content based on selected section */}
            </View>
          </Animated.View>
        </GestureDetector>
      )}
    </SafeAreaView>
  );
} 