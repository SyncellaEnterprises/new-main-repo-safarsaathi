import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import HelpCard from "../../components/help/HelpCard";
import React from "react";
const MATCHING_TIPS = [
  {
    title: "Profile Optimization",
    content: [
      "Use high-quality photos",
      "Write an engaging bio",
      "Keep information up-to-date",
      "Highlight your interests",
      "Be authentic and honest"
    ]
  },
  {
    title: "Search Preferences",
    content: [
      "Set realistic age range",
      "Define location preferences",
      "Specify interests",
      "Update regularly"
    ]
  },
  {
    title: "Engagement Tips",
    content: [
      "Be active on the platform",
      "Respond to messages promptly",
      "Show genuine interest",
      "Ask meaningful questions"
    ]
  }
];

export default function FindingMatches() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#1e293b]">
      <LinearGradient
        colors={['#1e293b', '#334155', '#475569']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <Animated.View
          entering={FadeInDown.duration(500)}
          className="px-6 pt-6 pb-4"
        >
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full items-center justify-center"
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white ml-4">Finding Matches</Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {MATCHING_TIPS.map((section, index) => (
            <HelpCard
              key={section.title}
              section={section}
              index={index}
              iconName={index === 0 ? "person" : index === 1 ? "options" : "chatbubbles"}
              iconColor="#FF6F3C"
              iconBgColor="bg-primary/20"
            />
          ))}
          
          <View className="h-20" />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}