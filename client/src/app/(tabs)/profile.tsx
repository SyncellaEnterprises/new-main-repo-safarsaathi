import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator, SafeAreaView, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

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

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-neutral-light items-center justify-center">
        <ActivityIndicator size="large" color="#7D5BA6" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-neutral-light items-center justify-center p-4">
        <Text className="text-primary-dark text-center mb-4 font-montserrat">{error}</Text>
        <TouchableOpacity 
          onPress={fetchProfile}
          className="bg-primary px-6 py-3 rounded-xl"
        >
          <Text className="text-neutral-lightest font-montserratMedium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-light">
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#7D5BA6', '#5A4180']}
        className="px-4 pt-12 pb-20"
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

      <ScrollView 
        className="flex-1 -mt-16"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#7D5BA6"]} />
        }
      >
        <View className="px-4">
          {/* Profile Card */}
          <View className="bg-white rounded-2xl p-4 shadow-sm">
            <View className="items-center">
              {/* Profile Photo */}
              <View className="relative">
                <LinearGradient
                  colors={['#7D5BA6', '#9D7EBD']}
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
                      <Ionicons name="person" size={50} color="#7D5BA6" />
                    </View>
                  )}
                </LinearGradient>
                <View className="absolute bottom-0 right-0 bg-secondary rounded-full w-10 h-10 items-center justify-center border-4 border-white">
                  <Ionicons name="camera" size={16} color="white" />
                </View>
              </View>

              {/* Basic Info */}
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
                  <Ionicons name="location" size={16} color="#7D5BA6" />
                  <Text className="text-neutral-dark font-montserrat ml-1">
                    {profile.location}
                  </Text>
                </View>
              )}
            </View>

            {/* Stats Row */}
            <View className="flex-row justify-around mt-6 pt-6 border-t border-neutral-light">
              <View className="items-center">
                <Text className="text-2xl font-youngSerif text-primary">
                  {getInterestCount()}
                </Text>
                <Text className="text-neutral-dark font-montserrat text-sm">
                  Interests
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-youngSerif text-secondary">
                  0
                </Text>
                <Text className="text-neutral-dark font-montserrat text-sm">
                  Matches
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-youngSerif text-tertiary">
                  0
                </Text>
                <Text className="text-neutral-dark font-montserrat text-sm">
                  Trips
                </Text>
              </View>
            </View>
          </View>

          {/* About Section */}
          <View className="mt-6 bg-white rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center mb-4">
              <LinearGradient
                colors={['#7D5BA6', '#9D7EBD']}
                className="w-10 h-10 rounded-full items-center justify-center"
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
          </View>

          {/* Interests Section */}
          {profile?.interest && (
            <View className="mt-6 bg-white rounded-2xl p-4 shadow-sm">
              <View className="flex-row items-center mb-4">
                <LinearGradient
                  colors={['#7D5BA6', '#9D7EBD']}
                  className="w-10 h-10 rounded-full items-center justify-center"
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
                    <View 
                      key={index}
                      className="bg-primary/10 px-4 py-2 rounded-full"
                    >
                      <Text className="text-primary font-montserratMedium">
                        {interest.trim()}
                      </Text>
                    </View>
                  ))
                }
              </View>
            </View>
          )}

          {/* Prompts Section */}
          {profile?.prompts?.prompts && profile.prompts.prompts.length > 0 && (
            <View className="mt-6 bg-white rounded-2xl p-4 shadow-sm mb-6">
              <View className="flex-row items-center mb-4">
                <LinearGradient
                  colors={['#7D5BA6', '#9D7EBD']}
                  className="w-10 h-10 rounded-full items-center justify-center"
                >
                  <Ionicons name="chatbubbles" size={20} color="white" />
                </LinearGradient>
                <Text className="text-lg font-montserratBold text-neutral-darkest ml-3">
                  Prompts
                </Text>
              </View>
              {profile.prompts.prompts.map((prompt, index) => (
                <View key={index} className="mb-4 last:mb-0">
                  <Text className="text-primary font-montserratBold mb-1">
                    {prompt.question}
                  </Text>
                  <Text className="text-neutral-dark font-montserrat">
                    {prompt.answer}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
} 