import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn } from "react-native-reanimated";
import React from "react";

interface TabHeaderProps {
  title: string;
  showIcons?: boolean;
  onSettingsPress?: () => void;
  leftIcon?: string;
  rightIcon?: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  showDate?: boolean;
  gradientColors?: string[];
  subtitle?: string;
}

export default function TabHeader({
  title,
  showIcons = true,
  leftIcon = "notifications-outline",
  rightIcon = "settings-outline",
  onLeftPress,
  onRightPress,
  showDate = true,
  gradientColors = ['rgba(125, 91, 166, 0.9)', 'rgba(90, 65, 128, 0.8)'],
  subtitle
}: TabHeaderProps) {
  const router = useRouter();

  return (
    <Animated.View 
      entering={FadeIn.duration(500)}
      className="px-4 pt-4 pb-4"
    >
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        className="absolute top-0 left-0 right-0 h-20"
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      
      <View className="flex-row items-center justify-between">
        <View className="flex-1">
          <Text className="text-2xl font-youngSerif text-white">{title}</Text>
          {showDate && (
            <Text className="text-white/70 text-sm mt-1 font-montserrat">
              {subtitle || new Date().toLocaleDateString('en-US', { 
                month: 'long', 
                day: 'numeric' 
              })}
            </Text>
          )}
        </View>

        {showIcons && (
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={onLeftPress || (() => router.push("/(icon)/notifications"))}
              className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
            >
              <Ionicons name={leftIcon as any} size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onRightPress || (() => router.push("/(icon)/settings"))}
              className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
            >
              <Ionicons name={rightIcon as any} size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
}
