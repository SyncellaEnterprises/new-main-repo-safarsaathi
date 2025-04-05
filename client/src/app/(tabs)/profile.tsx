import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator, SafeAreaView, ScrollView, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

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
      <View className="bg-neutral-lightest px-6 py-4 flex-row justify-between items-center">
        <Text className="text-xl font-youngSerif text-neutral-darkest">Profile</Text>
        <TouchableOpacity 
          onPress={() => router.push("/(profile)")}
          className="w-10 h-10 bg-primary/10 rounded-full items-center justify-center"
        >
          <Ionicons name="pencil" size={20} color="#7D5BA6" />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#7D5BA6"]} />
        }
      >
        <View className="items-center mt-8">
          {/* Profile Photo */}
          <View className="w-32 h-32 bg-neutral-medium rounded-full border-4 border-neutral-lightest shadow-md mb-4">
            {profile?.profile_photo ? (
              <Image
                source={{ uri: profile.profile_photo }}
                className="w-full h-full rounded-full"
                defaultSource={require('@/assets/images/avatar.png')}
              />
            ) : (
              <View className="w-full h-full rounded-full bg-primary-light/30 items-center justify-center">
                <Ionicons name="person" size={50} color="#7D5BA6" />
              </View>
            )}
          </View>

          {/* Basic Info */}
          <Text className="text-3xl font-youngSerif text-neutral-darkest">
            {profile?.username || 'User'}
          </Text>
          
          {profile?.occupation && (
            <Text className="text-neutral-dark mt-1 font-montserrat text-center">
              {profile.occupation}
            </Text>
          )}
          
          {profile?.location && (
            <View className="flex-row items-center mt-1">
              <Ionicons name="location" size={16} color="#7D5BA6" />
              <Text className="text-neutral-dark font-montserrat ml-1">
                {profile?.location}
              </Text>
            </View>
          )}

          {/* Bio Section */}
          <View className="mx-6 mt-8 bg-neutral-lightest rounded-xl p-6 w-full shadow-sm">
            <View className="flex-row items-center mb-2">
              <Ionicons name="information-circle" size={20} color="#7D5BA6" />
              <Text className="text-primary-dark font-montserratMedium ml-2">About Me</Text>
            </View>
            <Text className="text-neutral-dark leading-relaxed font-montserrat">
              {profile?.bio || 'No bio available. Tap the edit button to add more about yourself.'}
            </Text>
          </View>

        </View>
        
        <View className="h-20" />
      </ScrollView>
    </SafeAreaView>
  );
} 