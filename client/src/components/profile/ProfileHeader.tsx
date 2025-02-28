import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown } from "react-native-reanimated";

interface ProfileHeaderProps {
  isVerified: boolean;
}

export default function ProfileHeader({ isVerified }: ProfileHeaderProps) {
  const router = useRouter();

  return (
    <Animated.View 
      entering={FadeInDown.duration(500)}
      className="bg-primary-600 pt-14 pb-20"
    >
      <View className="flex-row justify-between items-center px-6">
        <View className="flex-row items-center">
          <Text className="text-white text-xl font-bold">Profile</Text>
          {isVerified && (
            <Ionicons name="checkmark-circle" size={24} color="#4ade80" className="ml-2" />
          )}
        </View>
        <View className="flex-row space-x-5">
          <TouchableOpacity onPress={() => router.push("/(settings)/settings")}>
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(help)/help")}>
            <Ionicons name="help-circle-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
} 