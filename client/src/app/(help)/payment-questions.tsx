import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import HelpCard from "../../components/help/HelpCard";

const PAYMENT_INFO = [
  {
    title: "Payment Methods",
    content: [
      "Credit/Debit Cards",
      "PayPal",
      "Apple Pay",
      "Google Pay",
      "Regional payment options"
    ]
  },
  {
    title: "Billing Issues",
    content: [
      "Subscription management",
      "Refund policy",
      "Payment declined",
      "Billing cycle information"
    ]
  },
  {
    title: "Premium Features",
    content: [
      "Premium benefits",
      "Subscription tiers",
      "Feature comparison",
      "Upgrade process"
    ]
  }
];

export default function PaymentQuestions() {
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
            <Text className="text-2xl font-bold text-white ml-4">Payment Questions</Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {PAYMENT_INFO.map((section, index) => (
            <HelpCard
              key={section.title}
              section={section}
              index={index}
              iconName={index === 0 ? "card" : index === 1 ? "alert-circle" : "star"}
              iconColor="#22c55e"
              iconBgColor="bg-green-500/20"
            />
          ))}
          
          <View className="h-20" />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}