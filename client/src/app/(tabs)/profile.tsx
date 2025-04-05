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
      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#7D5BA6"]} />
        }
      >
        {/* Profile Header */}
        <Animated.View 
          entering={FadeInDown.duration(500)}
          className="relative h-48"
        >
          <LinearGradient
            colors={['rgba(125, 91, 166, 0.9)', 'rgba(90, 65, 128, 0.8)']}
            className="absolute w-full h-full"
          />
          <View className="flex-row justify-between items-start p-4">
            <TouchableOpacity
              onPress={() => setShowEditProfile(true)}
              className="bg-white/20 px-4 py-2 rounded-full flex-row items-center"
            >
              <Ionicons name="pencil" size={16} color="white" />
              <Text className="text-white ml-2 font-montserratMedium">Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setShowSettings(true)}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              <Ionicons name="menu" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Profile Info Card */}
        <Animated.View 
          entering={FadeInDown.delay(100)}
          className="mx-4 -mt-20 bg-neutral-lightest rounded-3xl shadow-md overflow-hidden"
        >
          <View className="p-6">
            <View className="items-center">
              <View className="w-24 h-24 bg-neutral-medium rounded-full border-4 border-neutral-lightest shadow-sm mb-4">
                {profile?.profile_photo ? (
                  <Image
                    source={{ uri: profile.profile_photo }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <View className="w-full h-full rounded-full bg-primary-light/30 items-center justify-center">
                    <Ionicons name="person" size={40} color="#7D5BA6" />
                  </View>
                )}
                <View className="absolute right-0 bottom-0 bg-primary rounded-full p-1">
                  <Ionicons name="camera" size={14} color="white" />
                </View>
              </View>
              <Text className="text-2xl font-youngSerif text-neutral-darkest">
                {profile?.username}
              </Text>
              <Text className="text-neutral-dark mt-1 font-montserrat">
                {profile?.occupation || 'Add occupation'}
              </Text>
              <Text className="text-neutral-dark font-montserrat">
                {profile?.location || 'Add location'}
              </Text>
              
              {/* Verification Badge */}
              <TouchableOpacity 
                onPress={() => router.push("/(profile)/verification")}
                className="mt-4 flex-row items-center bg-primary/10 px-4 py-2 rounded-full"
              >
                <Ionicons name="shield-checkmark" size={16} color="#7D5BA6" />
                <Text className="text-primary ml-2 font-montserratMedium">Get Verified</Text>
              </TouchableOpacity>
            </View>

            <View className="mt-6">
              <Text className="text-neutral-dark text-center leading-relaxed font-montserrat">
                {profile?.bio || 'Add a bio to tell others about yourself'}
              </Text>
            </View>

            {/* Quick Stats */}
            <View className="flex-row justify-around mt-6 pt-6 border-t border-neutral-medium">
              <View className="items-center">
                <Text className="text-2xl font-montserratBold text-primary">
                  {profile?.interest?.length || 0}
                </Text>
                <Text className="text-neutral-dark font-montserrat">Interests</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-montserratBold text-primary">
                  {profile?.prompts?.prompts?.length || 0}
                </Text>
                <Text className="text-neutral-dark font-montserrat">Prompts</Text>
              </View>
              <View className="items-center">
                <Text className="text-2xl font-montserratBold text-primary">
                  {profile?.created_at ? 
                    Math.floor((new Date().getTime() - new Date(profile.created_at).getTime()) / (1000 * 3600 * 24))
                    : 0
                  }
                </Text>
                <Text className="text-neutral-dark font-montserrat">Days Active</Text>
              </View>
            </View>
          </View>
        </Animated.View>

     
        {/* <Animated.View 
          entering={FadeInDown.delay(200)}
          className="m-4 bg-white rounded-3xl shadow-sm"
        >
          <TouchableOpacity 
            onPress={() => router.push("/(profile)/edit-interests")}
            className="p-6"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-slate-800">
                Interests
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
            </View>
            <View className="flex-row flex-wrap gap-2">
              {profile?.interest?.slice(0, 6).map((interest, index) => (
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
              {profile?.interest && profile.interest.length > 6 && (
                <View className="bg-indigo-50 px-4 py-2 rounded-full">
                  <Text className="text-indigo-600">+{profile.interest.length - 6} more</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </Animated.View>

        {/* Prompts Section */}
        <Animated.View 
          entering={FadeInDown.delay(300)}
          className="m-4 bg-neutral-lightest rounded-3xl shadow-sm"
        >
          <TouchableOpacity 
            onPress={() => router.push("/(profile)/edit-prompts")}
            className="p-6"
          >
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-youngSerif text-neutral-darkest">
                Prompts
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </View>
            {profile?.prompts?.prompts?.slice(0, 2).map((prompt, index) => (
              <View key={index} className="mb-4 last:mb-0">
                <Text className="text-primary font-montserratMedium mb-2">
                  {prompt.question}
                </Text>
                <Text className="text-neutral-dark font-montserrat">
                  {prompt.answer}
                </Text>
              </View>
            ))}
            {(!profile?.prompts?.prompts || profile.prompts.prompts.length === 0) && (
              <Text className="text-neutral-dark font-montserrat">Add prompts to tell your story</Text>
            )}
            {profile?.prompts?.prompts && profile.prompts.prompts.length > 2 && (
              <Text className="text-primary mt-4 font-montserratMedium">
                +{profile.prompts.prompts.length - 2} more prompts
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Premium Card */}
        <Animated.View entering={FadeInDown.delay(400)}>
          <PremiumCard />
        </Animated.View>

        <View className="h-20" />
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal 
        visible={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        onSave={() => {
          fetchProfile();
          setShowEditProfile(false);
        }}
        userData={profile}
      />

      {/* Settings Menu */}
      <SettingsMenu 
        visible={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </SafeAreaView>
  );
} 