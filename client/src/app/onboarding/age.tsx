import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  FadeInDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue
} from "react-native-reanimated";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import React from "react";

const { width } = Dimensions.get('window');

export default function AgeScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateAge, isLoading } = useOnboarding();
  const [age, setAge] = useState(25);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handleAgeChange = (increment: boolean) => {
    scale.value = withSpring(1.2, {}, () => {
      scale.value = withSpring(1);
    });
    
    setAge(current => {
      const newAge = increment ? current + 1 : current - 1;
      if (newAge < 18) {
        toast.show("Minimum age is 18", "error");
        return current;
      }
      if (newAge > 100) {
        toast.show("Maximum age is 100", "error");
        return current;
      }
      return newAge;
    });
  };

  const handleNext = async () => {
    if (age < 18) {
      toast.show("You must be 18 or older", "error");
      return;
    }

    const success = await updateAge(age);
    if (success) {
      router.push('/onboarding/bio');
    } else {
      toast.show("Failed to save age. Please try again.", "error");
    }
  };

  return (
    <View className="flex-1 bg-primary-light">
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 p-6"
      >
        <Text className="text-3xl font-bold mb-2 text-indigo-600">
          How young are you?
        </Text>
        <Text className="text-slate-500 mb-8">
          Let others know your age
        </Text>

        <View className="items-center">
          <Animated.View 
            style={animatedStyle}
            className="bg-white w-80 h-80 rounded-3xl items-center justify-center shadow-lg mb-8 border border-indigo-100"
          >
            <Text className="text-8xl font-bold text-indigo-600">
              {age}
            </Text>
          </Animated.View>

          <View className="flex-row items-center justify-center space-x-8">
            <TouchableOpacity
              onPress={() => handleAgeChange(false)}
              className="bg-indigo-100 w-16 h-16 rounded-full items-center justify-center"
              disabled={isLoading}
            >
              <Ionicons name="remove" size={30} color="#6366f1" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAgeChange(true)}
              className="bg-indigo-100 w-16 h-16 rounded-full items-center justify-center"
              disabled={isLoading}
            >
              <Ionicons name="add" size={30} color="#6366f1" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleNext}
          disabled={isLoading}
          className="bg-indigo-600 py-4 rounded-xl mt-auto"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              Continue
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
