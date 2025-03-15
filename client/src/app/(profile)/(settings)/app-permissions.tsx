import { View, Text, ScrollView, TouchableOpacity, Switch } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from "react";

const PERMISSIONS = [
  {
    title: "Camera",
    description: "Take photos and record videos",
    icon: "camera-outline",
    key: "camera"
  },
  {
    title: "Photo Library",
    description: "Access your photos and videos",
    icon: "images-outline",
    key: "photos"
  },
  {
    title: "Location",
    description: "Access your device location",
    icon: "location-outline",
    key: "location"
  },
  {
    title: "Notifications",
    description: "Send you push notifications",
    icon: "notifications-outline",
    key: "notifications"
  },
  {
    title: "Contacts",
    description: "Access your contacts",
    icon: "people-outline",
    key: "contacts"
  },
  {
    title: "Microphone",
    description: "Record audio",
    icon: "mic-outline",
    key: "microphone"
  },
  {
    title: "Health Data",
    description: "Access health and fitness data",
    icon: "fitness-outline",
    key: "health"
  }
];

export default function AppPermissionsScreen() {
  const router = useRouter();
  const [permissions, setPermissions] = useState({
    camera: true,
    photos: true,
    location: true,
    notifications: true,
    contacts: false,
    microphone: true,
    health: false
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
            <Text className="text-2xl font-bold text-white ml-4">App Permissions</Text>
          </View>
          
          <Text className="text-white/60 px-1 mb-4">
            Control which features and data the app can access on your device
          </Text>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {PERMISSIONS.map((permission, index) => (
            <Animated.View
              key={permission.key}
              entering={FadeInDown.delay(index * 100)}
              className="bg-white/10 backdrop-blur-md p-4 rounded-xl mb-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-10 h-10 bg-indigo-500/20 rounded-xl items-center justify-center">
                    <Ionicons name={permission.icon} size={24} color="#6366f1" />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-white font-semibold">{permission.title}</Text>
                    <Text className="text-white/60 text-sm">{permission.description}</Text>
                  </View>
                </View>
                <Switch
                  value={permissions[permission.key as keyof typeof permissions]}
                  onValueChange={(value) =>
                    setPermissions(prev => ({ ...prev, [permission.key]: value }))
                  }
                  trackColor={{ false: "#1a237e", true: "#3949ab" }}
                  thumbColor={permissions[permission.key as keyof typeof permissions] ? "#fff" : "#c5cae9"}
                />
              </View>
            </Animated.View>
          ))}
          
          <View className="h-20" />
        </ScrollView>
      </LinearGradient>
    </View>
  );
} 