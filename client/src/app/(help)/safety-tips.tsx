import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import HelpCard from "../../components/help/HelpCard";

const SAFETY_GUIDELINES = [
  {
    title: "Meeting in Person",
    content: [
      "Always meet in public places",
      "Tell a friend about your plans",
      "Stay sober during first meetings",
      "Trust your instincts",
      "Share your location with trusted contacts"
    ]
  },
  {
    title: "Online Communication",
    content: [
      "Keep conversations within the app",
      "Don't share personal information early",
      "Be wary of financial requests",
      "Report suspicious behavior",
      "Block and report harassment"
    ]
  },
  {
    title: "Profile Safety",
    content: [
      "Use recent but appropriate photos",
      "Avoid sharing workplace details",
      "Don't include contact info in bio",
      "Be mindful of background details in photos"
    ]
  }
];

export default function SafetyTips() {
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
            <Text className="text-2xl font-bold text-white ml-4">Safety Tips</Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {SAFETY_GUIDELINES.map((section, index) => (
            <HelpCard
              key={section.title}
              section={section}
              index={index}
              iconName={index === 0 ? "people" : index === 1 ? "chatbubbles" : "person-circle"}
              iconColor="#ef4444"
              iconBgColor="bg-red-500/20"
            />
          ))}
          
          <View className="h-20" />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}