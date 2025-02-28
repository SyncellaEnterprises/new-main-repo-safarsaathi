import { View, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

interface HelpItem {
  title: string;
  content: string[];
}

interface HelpCardProps {
  section: HelpItem;
  index: number;
  iconName: string;
  iconColor: string;
  iconBgColor: string;
}

export default function HelpCard({ 
  section, 
  index, 
  iconName, 
  iconColor, 
  iconBgColor 
}: HelpCardProps) {
  return (
    <Animated.View
      key={section.title}
      entering={FadeInDown.delay(200 + index * 100)}
      className="bg-white/10 backdrop-blur-md p-6 rounded-2xl mb-4"
    >
      <View className="flex-row items-center mb-4">
        <View className={`w-10 h-10 ${iconBgColor} rounded-full items-center justify-center`}>
          <Ionicons name={iconName as any} size={24} color={iconColor} />
        </View>
        <Text className="text-xl font-bold text-white ml-3">
          {section.title}
        </Text>
      </View>
      
      {section.content.map((item, itemIndex) => (
        <View key={itemIndex} className="flex-row items-center mb-3">
          <View className={`w-2 h-2 rounded-full mr-3`} style={{ backgroundColor: iconColor }} />
          <Text className="text-white/80 text-base flex-1">
            {item}
          </Text>
        </View>
      ))}
    </Animated.View>
  );
} 