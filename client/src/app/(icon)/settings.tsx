import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import React from "react";
import { useAuth } from "@/src/context/AuthContext";

const SETTINGS_SECTIONS = [
  {
    title: "Account",
    subtitle: "Manage your personal information and preferences",
    icon: "person-circle",
    items: [
      {
        label: "Edit Profile",
        icon: "person-outline",
        type: "link",
        description: "Update your profile information",
        route: "/(tabs)/profile"
      },
      {
        label: "Privacy",
        icon: "lock-closed-outline",
        type: "link",
        description: "Control your privacy settings",
        route: "/(settings)/privacy"
      },
      {
        label: "Notifications",
        icon: "notifications-outline",
        type: "toggle",
        description: "Manage your notifications",
        route: "/(settings)/notifications"
      },
      {
        label: "Location Services",
        icon: "location-outline",
        type: "toggle",
        description: "Control location access",
        route: "/(settings)/location"
      }
    ]
  },
  {
    title: "Preferences",
    subtitle: "Customize your app experience",
    icon: "color-palette",
    items: [
      {
        label: "App Permissions",
        icon: "shield-outline",
        type: "link",
        description: "Manage app permissions",
        route: "/(settings)/app-permissions"
      }
    ]
  },
  {
    title: "Support & Legal",
    subtitle: "Get help and learn about our policies",
    icon: "help-buoy",
    items: [
      {
        label: "Help Center",
        icon: "help-circle-outline",
        type: "link",
        description: "Get assistance",
        route: "/settings/help-center"
      },
      {
        label: "Report a Problem",
        icon: "warning-outline",
        type: "link",
        description: "Report issues",
        route: "/settings/report-problem"
      },
      {
        label: "Terms of Service",
        icon: "document-text-outline",
        type: "link",
        description: "Read our terms",
        route: "/settings/terms-of-service"
      }
    ]
  }
];

const { user } = useAuth();

export default function SettingsScreen() {
  const router = useRouter();
  const [toggles, setToggles] = useState<{ [key: string]: boolean }>({
    Notifications: true,
    "Location Services": true,
    "Dark Mode": false
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
          <View className="flex-row items-center mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-full items-center justify-center"
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-2xl font-bold text-white ml-4">Settings</Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {SETTINGS_SECTIONS.map((section, sectionIndex) => (
            <Animated.View
              key={section.title}
              entering={FadeInUp.delay(sectionIndex * 200)}
              className="mb-8"
            >
              <View className="flex-row items-center mb-4">
                <LinearGradient
                  colors={['#5c6bc0', '#3f51b5']}
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                >
                  <Ionicons name={section.icon as any} size={24} color="#fff" />
                </LinearGradient>
                <View>
                  <Text className="text-lg font-bold text-white">
                    {section.title}
                  </Text>
                  <Text className="text-white/70 text-sm">
                    {section.subtitle}
                  </Text>
                </View>
              </View>

              <View className="bg-white/10 backdrop-blur-lg rounded-3xl overflow-hidden">
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={item.label}
                    className={`flex-row items-center justify-between p-4 ${itemIndex !== section.items.length - 1 ? 'border-b border-white/10' : ''
                      }`}
                    onPress={() => {
                      if (item.type === 'link') {
                        router.push(item.route);  // Navigate to the route defined in the item
                      }
                    }}
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="w-10 h-10 bg-white/10 rounded-xl items-center justify-center">
                        <Ionicons name={item.icon as any} size={20} color="#fff" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-white font-semibold">{item.label}</Text>
                        <Text className="text-white/60 text-sm">{item.description}</Text>
                      </View>
                    </View>
                    {item.type === 'toggle' ? (
                      <Switch
                        value={toggles[item.label]}
                        onValueChange={(value) =>
                          setToggles(prev => ({ ...prev, [item.label]: value }))
                        }
                        trackColor={{ false: "#1a237e", true: "#3949ab" }}
                        thumbColor={toggles[item.label] ? "#fff" : "#c5cae9"}
                        ios_backgroundColor="#1a237e"
                      />
                    ) : (
                      <View className="w-8 h-8 bg-white/10 rounded-xl items-center justify-center">
                        <Ionicons name="chevron-forward" size={20} color="#fff" />
                      </View>
                    )}
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
