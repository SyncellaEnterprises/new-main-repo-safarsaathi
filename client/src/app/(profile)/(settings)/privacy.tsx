import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from "react";

const PRIVACY_OPTIONS = [
  {
    title: "Profile Visibility",
    description: "Control who can see your profile",
    icon: "eye-outline",
    type: "toggle"
  },
  {
    title: "Online Status",
    description: "Show when you're active",
    icon: "radio-outline",
    type: "toggle"
  },
  {
    title: "Read Receipts",
    description: "Show when you've read messages",
    icon: "checkmark-done-outline",
    type: "toggle"
  },
  {
    title: "Blocked Users",
    description: "Manage your blocked users list",
    icon: "person-remove-outline",
    type: "link"
  },
  {
    title: "Data Sharing",
    description: "Control how your data is shared",
    icon: "share-outline",
    type: "link"
  }
];

export default function PrivacyScreen() {
  const router = useRouter();
  const [toggles, setToggles] = useState({
    "Profile Visibility": true,
    "Online Status": true,
    "Read Receipts": false
  });

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
            <Text className="text-2xl font-bold text-white ml-4">Privacy</Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {PRIVACY_OPTIONS.map((option, index) => (
            <Animated.View
              key={option.title}
              entering={FadeInDown.delay(index * 100)}
              className="bg-white/10 backdrop-blur-md p-4 rounded-xl mb-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 bg-primary/20 rounded-xl items-center justify-center">
                    <Ionicons name={option.icon} size={24} color="#FF6F3C" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold">{option.title}</Text>
                    <Text className="text-white/60 text-sm">{option.description}</Text>
                  </View>
                </View>
                {option.type === 'toggle' ? (
                  <Switch
                    value={toggles[option.title]}
                    onValueChange={(value) =>
                      setToggles(prev => ({ ...prev, [option.title]: value }))
                    }
                    trackColor={{ false: "#1a237e", true: "#3949ab" }}
                    thumbColor={toggles[option.title] ? "#fff" : "#c5cae9"}
                  />
                ) : (
                  <TouchableOpacity
                    className="w-8 h-8 bg-white/10 rounded-xl items-center justify-center"
                  >
                    <Ionicons name="chevron-forward" size={20} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </Animated.View>
          ))}
          
          <View className="h-20" />
        </ScrollView>
      </LinearGradient>
    </View>
  );
} 