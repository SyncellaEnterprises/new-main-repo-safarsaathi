import { View, ScrollView, TouchableOpacity, Text, SafeAreaView, Image, ActivityIndicator, RefreshControl } from "react-native";
import { useState, useCallback } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { PremiumCard } from '@/src/components/profile/PremiumCard';
import SettingsMenu from "@/src/components/profile/SettingsMenu";
import EditProfileModal from "@/src/components/profile/EditProfileModal";
import React from "react";
import { useProfile } from '@/src/hooks/useProfile';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, loading, error, fetchProfile } = useProfile();
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, [fetchProfile]);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center p-4">
        <Text className="text-red-500 text-center mb-4">{error}</Text>
        <TouchableOpacity 
          onPress={fetchProfile}
          className="bg-indigo-600 px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-semibold">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Card */}
        <Animated.View 
          entering={FadeInDown.duration(500)}
          className="m-4 bg-white rounded-3xl overflow-hidden shadow-sm"
        >
          <View className="p-6">
            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-slate-800">
                  {profile?.username}
                </Text>
                <Text className="text-slate-500 mt-1">
                  {profile?.occupation || 'Add occupation'}
                </Text>
                <Text className="text-slate-500">
                  {profile?.location || 'Add location'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowSettings(true)}
                className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center"
              >
                <Ionicons name="menu" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View className="mt-6">
              <Text className="text-slate-600 leading-relaxed">
                {profile?.bio || 'Add a bio to tell others about yourself'}
              </Text>
            </View>

            <TouchableOpacity 
              onPress={() => setShowEditProfile(true)}
              className="mt-6 bg-indigo-600 py-3 rounded-xl"
            >
              <Text className="text-white text-center font-semibold">
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Stats Card */}
        <Animated.View 
          entering={FadeInDown.delay(100).duration(500)}
          className="mx-4 bg-white rounded-3xl overflow-hidden shadow-sm"
        >
          <View className="p-6">
            <Text className="text-lg font-semibold text-slate-800 mb-4">
              Your Profile Stats
            </Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-2xl font-bold text-indigo-600">
                  {profile?.interest?.length || 0}
                </Text>
                <Text className="text-slate-500 mt-1">Interests</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-indigo-600">
                  {profile?.prompts?.prompts?.length || 0}
                </Text>
                <Text className="text-slate-500 mt-1">Prompts</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-bold text-indigo-600">
                  {profile?.created_at ? 
                    Math.floor((new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 3600 * 24))
                    : 0
                  }
                </Text>
                <Text className="text-slate-500 mt-1">Days Active</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Interests Section */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(500)}
          className="m-4 bg-white rounded-3xl overflow-hidden shadow-sm"
        >
          <View className="p-6">
            <Text className="text-lg font-semibold text-slate-800 mb-4">
              Interests
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {profile?.interest?.map((interest, index) => (
                <View 
                  key={index}
                  className="bg-indigo-50 px-4 py-2 rounded-full"
                >
                  <Text className="text-indigo-600">{interest}</Text>
                </View>
              ))}
              {(!profile?.interest || profile.interest.length === 0) && (
                <Text className="text-slate-500">Add your interests</Text>
              )}
            </View>
          </View>
        </Animated.View>

        {/* Prompts Section */}
        <Animated.View 
          entering={FadeInDown.delay(300).duration(500)}
          className="m-4 bg-white rounded-3xl overflow-hidden shadow-sm"
        >
          <View className="p-6">
            <Text className="text-lg font-semibold text-slate-800 mb-4">
              Prompts
            </Text>
            {profile?.prompts?.prompts?.map((prompt, index) => (
              <View key={index} className="mb-4 last:mb-0">
                <Text className="text-indigo-600 font-medium mb-2">
                  {prompt.question}
                </Text>
                <Text className="text-slate-600">
                  {prompt.answer}
                </Text>
              </View>
            ))}
            {(!profile?.prompts?.prompts || profile.prompts.prompts.length === 0) && (
              <Text className="text-slate-500">Add prompts to tell your story</Text>
            )}
          </View>
        </Animated.View>

        {/* Premium Card */}
        <Animated.View entering={FadeInDown.delay(400).duration(500)}>
          <PremiumCard />
        </Animated.View>

        <View className="h-20" />
      </ScrollView>

      <EditProfileModal 
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSave={() => {
          fetchProfile();
          setShowEditProfile(false);
        }}
        userData={profile}
      />

      <SettingsMenu 
        visible={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </SafeAreaView>
  );
} 