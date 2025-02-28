import React from "react";
import { View, Text } from "react-native";

interface InterestsListProps {
  interests: string[];
}

export default function InterestsList({ interests }: InterestsListProps) {
  return (
    <View className="mt-6">
      <Text className="text-lg font-semibold text-slate-800 mb-2">Interests</Text>
      <View className="flex-row flex-wrap">
        {interests.map((interest, index) => (
          <View 
            key={index}
            className="bg-indigo-50 rounded-full px-4 py-2 mr-2 mb-2"
          >
            <Text className="text-indigo-600">{interest}</Text>
          </View>
        ))}
      </View>
    </View>
  );
} 