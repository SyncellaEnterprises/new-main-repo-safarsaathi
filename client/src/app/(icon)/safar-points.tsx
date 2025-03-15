import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from "react-native-reanimated";
import { BlurView } from 'expo-blur';

const POINT_ACTIVITIES = [
  {
    id: '1',
    title: 'Complete Profile',
    points: 100,
    icon: 'person',
    color: '#10B981'
  },
  {
    id: '2',
    title: 'First Trip Plan',
    points: 250,
    icon: 'airplane',
    color: '#6366F1'
  },
  {
    id: '3',
    title: 'Share Experience',
    points: 150,
    icon: 'share',
    color: '#F59E0B'
  },
  {
    id: '4',
    title: 'Invite Friends',
    points: 300,
    icon: 'people',
    color: '#EC4899'
  }
];

export default function SafarPointsScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#1a237e]">
      <LinearGradient
        colors={['#1a237e', '#283593', '#3949ab']}
        className="flex-1"
      >
        {/* Header */}
        <View className="pt-14 px-6 pb-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white">Safar Points</Text>
            <View className="w-10" />
          </View>
        </View>

        <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>
          {/* Points Display */}
          <Animated.View 
            entering={FadeInDown.delay(200)}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6"
          >
            <Text className="text-white/70 text-lg">Your Points</Text>
            <Text className="text-white text-4xl font-bold mt-2">2,450</Text>
            <View className="flex-row items-center mt-2">
              <Ionicons name="trending-up" size={20} color="#4CAF50" />
              <Text className="text-[#4CAF50] ml-1">+150 this week</Text>
            </View>
          </Animated.View>

          {/* Spin Wheel Card */}
          <Animated.View 
            entering={FadeInDown.delay(400)}
            className="mb-6"
          >
            <TouchableOpacity 
              onPress={() => router.push("/spin-wheel")}
              className="bg-white/10 backdrop-blur-lg rounded-3xl p-6"
            >
              <View className="flex-row justify-between items-center">
                <View>
                  <Text className="text-white text-xl font-bold">Daily Spin</Text>
                  <Text className="text-white/70 mt-1">Spin to win bonus points!</Text>
                </View>
                <View className="w-12 h-12 bg-indigo-500/20 rounded-full items-center justify-center">
                  <Ionicons name="gift" size={24} color="#fff" />
                </View>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Points History */}
          <Animated.View 
            entering={FadeInDown.delay(600)}
            className="bg-white/10 backdrop-blur-lg rounded-3xl p-6 mb-6"
          >
            <Text className="text-white text-xl font-bold mb-4">Points History</Text>
            {[1, 2, 3].map((_, index) => (
              <View 
                key={index}
                className="flex-row items-center justify-between mb-4 last:mb-0"
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-indigo-500/20 rounded-full items-center justify-center">
                    <Ionicons name="airplane" size={20} color="#fff" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-white font-semibold">Trip Completed</Text>
                    <Text className="text-white/60">Mumbai to Goa</Text>
                  </View>
                </View>
                <Text className="text-white font-semibold">+100</Text>
              </View>
            ))}
          </Animated.View>

          {/* Leave space for bottom tab */}
          <View className="h-32" />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}