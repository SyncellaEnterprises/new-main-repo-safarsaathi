import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import HelpCard from "../../components/help/HelpCard";

const ACCOUNT_ISSUES = [
  {
    title: "Login Problems",
    content: [
      "Reset your password",
      "Clear app cache and try again",
      "Check your internet connection",
      "Ensure correct email format",
      "Contact support if issues persist"
    ]
  },
  {
    title: "Account Recovery",
    content: [
      "Use email recovery option",
      "Verify your identity",
      "Update recovery information",
      "Follow security checks"
    ]
  },
  {
    title: "Account Restrictions",
    content: [
      "Review community guidelines",
      "Appeal account restrictions",
      "Understand violation reasons",
      "Prevent future issues"
    ]
  }
];

export default function AccountIssues() {
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
            <Text className="text-2xl font-bold text-white ml-4">Account Issues</Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {ACCOUNT_ISSUES.map((section, index) => (
            <HelpCard
              key={section.title}
              section={section}
              index={index}
              iconName={index === 0 ? "log-in" : index === 1 ? "refresh-circle" : "warning"}
              iconColor="#eab308"
              iconBgColor="bg-yellow-500/20"
            />
          ))}
          
          <View className="h-20" />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}   