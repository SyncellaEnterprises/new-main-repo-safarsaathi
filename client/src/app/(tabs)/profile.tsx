import { View, ScrollView, TouchableOpacity, Text, SafeAreaView, Image } from "react-native";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from "expo-router";
import { PremiumCard } from '@/src/components/profile/PremiumCard';
import SettingsMenu from "@/src/components/profile/SettingsMenu";
import EditProfileModal from "@/src/components/profile/EditProfileModal";
import React from "react";

// Mock user data with extended information
const USER = {
  id: "1",
  name: "Alex Johnson",
  username: "@alexj",
  age: 26,
  gender: "Male",
  location: {
    district: "Mumbai City",
    state: "Maharashtra"
  },
  isVerified: true,
  bio: "Adventure seeker | Photography enthusiast | Coffee lover",
  about: "I'm passionate about exploring new places and meeting interesting people. Love to capture moments through my lens and share stories over coffee.",
  occupation: "Software Engineer",
  photos: [
    "https://picsum.photos/400",
    "https://picsum.photos/401",
    "https://picsum.photos/402",
    "https://picsum.photos/403",
    "https://picsum.photos/404",
    "https://picsum.photos/405",
  ],
  interests: ["Hiking", "Photography", "Local Food", "Museums", "Beach", "Travel"],
  stats: {
    followers: 245,
    following: 186,
    likes: 1.2,
  }
};

export default function ProfileScreen() {
  const router = useRouter();
  const [showSettings, setShowSettings] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <LinearGradient
        colors={['#3B82F6', '#60A5FA', '#93C5FD']}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 py-4">
          <View className="flex-row items-center">
            <Text className="text-2xl font-bold text-white">{USER.username}</Text>
            {USER.isVerified && (
              <Ionicons name="checkmark-circle" size={20} color="#fff" className="ml-1" />
            )}
          </View>
          <TouchableOpacity
            onPress={() => setShowSettings(true)}
            className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
          >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Profile Stats */}
          <View className="px-6 py-4">
            <View className="flex-row items-center justify-between mb-6">
              <TouchableOpacity 
                onPress={() => setShowEditProfile(true)}
                className="items-center"
              >
                <Image
                  source={{ uri: USER.photos[0] }}
                  className="w-24 h-24 rounded-full border-2 border-white"
                />
                <Text className="text-white font-semibold mt-2">{USER.name}</Text>
                <Text className="text-white/60 text-sm">{USER.occupation}</Text>
              </TouchableOpacity>

              <View className="flex-row space-x-8">
                <TouchableOpacity className="items-center">
                  <Text className="text-white font-bold text-xl">{USER.stats.followers}</Text>
                  <Text className="text-white/60">Followers</Text>
                </TouchableOpacity>
                <TouchableOpacity className="items-center">
                  <Text className="text-white font-bold text-xl">{USER.stats.following}</Text>
                  <Text className="text-white/60">Following</Text>
                </TouchableOpacity>
                <TouchableOpacity className="items-center">
                  <Text className="text-white font-bold text-xl">{USER.stats.likes}K</Text>
                  <Text className="text-white/60">Likes</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Action Buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity 
                onPress={() => setShowEditProfile(true)}
                className="flex-1 bg-white/10 py-3 rounded-xl"
              >
                <Text className="text-white text-center font-semibold">Edit Profile</Text>
              </TouchableOpacity>
              <TouchableOpacity className="flex-1 bg-primary py-3 rounded-xl">
                <Text className="text-white text-center font-semibold">Share Profile</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Bio */}
          <View className="px-6 mb-6">
            <Text className="text-white/80 leading-5">{USER.bio}</Text>
          </View>

          {/* Photo Grid */}
          <View className="px-6">
            <Text className="text-white font-semibold text-lg mb-4">Photos</Text>
            <View className="flex-row flex-wrap gap-2">
              {USER.photos.map((photo, index) => (
                <TouchableOpacity 
                  key={index}
                  className="w-[32%] aspect-square"
                >
                  <Image
                    source={{ uri: photo }}
                    className="w-full h-full rounded-xl"
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Interests */}
          <View className="px-6 mt-6">
            <Text className="text-white font-semibold text-lg mb-4">Interests</Text>
            <View className="flex-row flex-wrap gap-2">
              {USER.interests.map((interest, index) => (
                <View 
                  key={index}
                  className="bg-white/10 px-4 py-2 rounded-full"
                >
                  <Text className="text-white">{interest}</Text>
                </View>
              ))}
            </View>
          </View>

          <View className="h-20" />
          <PremiumCard />
        </ScrollView>

        <EditProfileModal 
          visible={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          onSave={() => {
            // Handle save
            setShowEditProfile(false);
          }}
          userData={USER}
        />

        <SettingsMenu 
          visible={showSettings} 
          onClose={() => setShowSettings(false)} 
        />
      </LinearGradient>
    </SafeAreaView>
  );
} 