import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from "react";

const HELP_SECTIONS = [
  {
    title: "Getting Started",
    icon: "rocket",
    color: ["#4c1d95", "#6d28d9"],
    items: [
      { title: "Profile Setup",
         description: "Learn how to set up your profile",
          route: "/(help)/profile-setup" },
      { title: "Finding Matches",
         description: "Tips for finding the right connections", route: "/(help)/finding-matches" },
      { title: "Safety Tips", 
        description: "Stay safe while using our platform", 
        route: "/(help)/safety-tips" }
    ]
  },
  {
    title: "Account & Privacy",
    icon: "shield",
    color: ["#065f46", "#059669"],
    items: [
      { title: "Privacy Settings",
         description: "Manage your privacy preferences", 
         route: "/(help)/privacy-settings" },
      { title: "Account Security", 
        description: "Keep your account secure", 
        route: "/(help)/account-security" },
      { title: "Data Usage",
         description: "Understand how we use your data", 
         route: "/(help)/data-usage" }
    ]
  },
  {
    title: "Common Issues",
    icon: "help-buoy",
    color: ["#9d174d", "#db2777"],
    items: [
      { title: "Technical Problems", 
        description: "Solutions for common technical issues", route: "/(help)/technical-problems" },
      { title: "Account Issues", 
        description: "Resolve account-related problems", 
        route: "/(help)/account-issues" },
      { title: "Payment Questions", 
        description: "Answers about billing and payments", 
        route: "/(help)/payment-questions" }
    ]
  }
];

export default function HelpScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleItemPress = (route: string) => {
    router.push(route);
  };

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
            <Text className="text-2xl font-bold text-white ml-4">Help Center</Text>
          </View>

          {/* <View className="bg-white/10 backdrop-blur-md rounded-3xl p-3 flex-row items-center mb-4 shadow-md">
            <Ionicons name="search" size={20} color="#fff" />
            <TextInput
              placeholder="Search for help..."
              placeholderTextColor="rgba(255,255,255,0.5)"
              className="flex-1 text-white ml-2 text-base"
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={{ paddingVertical: 10 }}
            />
          </View> */}
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {HELP_SECTIONS.map((section, index) => (
            <Animated.View
              key={section.title}
              entering={FadeInUp.delay(index * 200)}
              className="mb-6"
            >
              <View className="flex-row items-center mb-4">
                <LinearGradient
                  colors={section.color as [string, string, ...string[]]}
                  className="w-12 h-12 rounded-xl items-center justify-center"
                >
                  <Ionicons name={section.icon as any} size={24} color="white" />
                </LinearGradient>
                <Text className="text-xl font-bold text-white ml-3">
                  {section.title}
                </Text>
              </View>

              <View className="space-y-3">
                {section.items.map((item) => (
                  <TouchableOpacity
                    key={item.title}
                    onPress={() => handleItemPress(item.route)}
                    className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/5"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-white font-semibold text-lg">
                          {item.title}
                        </Text>
                        <Text className="text-white/60 mt-1">
                          {item.description}
                        </Text>
                      </View>
                      <View className="w-8 h-8 bg-white/10 rounded-xl items-center justify-center ml-3">
                        <Ionicons name="chevron-forward" size={20} color="#fff" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          ))}
          <View className="h-20" />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
