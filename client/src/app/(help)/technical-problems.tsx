import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import HelpCard from "../../components/help/HelpCard";

const TECH_SOLUTIONS = [
  {
    title: "App Performance",
    content: [
      "Clear app cache",
      "Update to latest version",
      "Check device storage",
      "Restart the app",
      "Reinstall if necessary"
    ]
  },
  {
    title: "Connection Issues",
    content: [
      "Check internet connection",
      "Try different network",
      "Enable/disable WiFi",
      "Check app permissions"
    ]
  },
  {
    title: "Feature Problems",
    content: [
      "Messaging issues",
      "Photo upload problems",
      "Location services",
      "Notification settings"
    ]
  }
];

export default function TechnicalProblems() {
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
            <Text className="text-2xl font-bold text-white ml-4">Technical Problems</Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {TECH_SOLUTIONS.map((section, index) => (
            <HelpCard
              key={section.title}
              section={section}
              index={index}
              iconName={index === 0 ? "speedometer" : index === 1 ? "wifi" : "build"}
              iconColor="#f97316"
              iconBgColor="bg-orange-500/20"
            />
          ))}
          
          <View className="h-20" />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}