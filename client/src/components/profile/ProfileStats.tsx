import React from "react";
import { View, Text } from "react-native";

interface ProfileStatsProps {
  stats: {
    followers: number;
    following: number;
    trips: number;
  };
}

export default function ProfileStats({ stats }: ProfileStatsProps) {
  return (
    <View className="flex-row justify-around mt-6 pb-6 border-b border-slate-100">
      {Object.entries(stats).map(([key, value]) => (
        <View key={key} className="items-center">
          <Text className="text-2xl font-bold text-indigo-600">{value}</Text>
          <Text className="text-slate-600 capitalize">{key}</Text>
        </View>
      ))}
    </View>
  );
} 