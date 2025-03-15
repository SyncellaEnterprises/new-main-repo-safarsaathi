import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

export default function ProfileSetupHelpScreen() {
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
            <Text className="text-2xl font-bold text-white ml-4">Profile Setup</Text>
          </View>
        </Animated.View>

        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            entering={FadeInDown.delay(200)}
            className="bg-white/10 backdrop-blur-md p-6 rounded-2xl mb-4"
          >
            <Text className="text-xl font-bold text-white mb-4">
              How to Set Up Your Profile
            </Text>
            <Text className="text-white/80 text-base leading-6 mb-3">
              1. Add a clear profile photo
            </Text>
            <Text className="text-white/80 text-base leading-6 mb-3">
              2. Fill in your basic information
            </Text>
            <Text className="text-white/80 text-base leading-6 mb-3">
              3. Choose your interests
            </Text>
            <Text className="text-white/80 text-base leading-6">
              4. Write an engaging bio
            </Text>
          </Animated.View>
          
          {/* Add more content sections as needed */}
          
          <View className="h-20" />
        </ScrollView>
      </LinearGradient>
    </View>
  );
} 