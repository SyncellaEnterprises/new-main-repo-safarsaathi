import React from "react";
import { View, Text, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ProfileInfoProps {
  photo: string;
  name: string;
  isVerified: boolean;
  occupation: string;
  location: {
    district: string;
    state: string;
  };
}

export default function ProfileInfo({ photo, name, isVerified, occupation, location }: ProfileInfoProps) {
  return (
    <View className="flex-row">
      <Image
        source={{ uri: photo }}
        className="w-24 h-24 rounded-2xl"
      />
      <View className="ml-4 flex-1 justify-center">
        <View className="flex-row items-center">
          <Text className="text-2xl font-bold text-slate-800">{name}</Text>
          {isVerified && (
            <Ionicons name="checkmark-circle" size={20} color="#4ade80" className="ml-1" />
          )}
        </View>
        <Text className="text-slate-500 mt-1">{occupation}</Text>
        <Text className="text-slate-500">
          {location.district}, {location.state}
        </Text>
      </View>
    </View>
  );
} 