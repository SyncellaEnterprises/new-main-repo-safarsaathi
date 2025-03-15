import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import HelpCard from "../../components/help/HelpCard";

const SECURITY_TIPS = [
  {
    title: "Strong Password Guidelines",
    content: [
      "Use at least 8 characters",
      "Include numbers and special characters",
      "Mix uppercase and lowercase letters",
      "Avoid using personal information",
      "Don't reuse passwords from other accounts"
    ]
  },
  {
    title: "Two-Factor Authentication",
    content: [
      "Enable 2FA for extra security",
      "Use authenticator apps for better protection",
      "Keep backup codes in a safe place",
      "Update recovery phone number regularly"
    ]
  },
  {
    title: "Device Management",
    content: [
      "Review active sessions regularly",
      "Log out from unused devices",
      "Enable biometric login when possible",
      "Keep your app updated"
    ]
  }
];

export default function AccountSecurity() {
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
            <Text className="text-2xl font-bold text-white ml-4">Account Security</Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {SECURITY_TIPS.map((section, index) => (
            <HelpCard
              key={section.title}
              section={section}
              index={index}
              iconName={index === 0 ? "key" : index === 1 ? "shield-checkmark" : "phone-portrait"}
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