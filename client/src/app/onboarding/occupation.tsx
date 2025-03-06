import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue
} from "react-native-reanimated";
import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

const OCCUPATIONS = [
  { id: 'student', label: 'Student', icon: 'school', description: 'Currently studying' },
  { id: 'professional', label: 'Professional', icon: 'briefcase', description: 'Working in a company' },
  { id: 'entrepreneur', label: 'Entrepreneur', icon: 'trending-up', description: 'Running own business' },
  { id: 'creative', label: 'Creative', icon: 'color-palette', description: 'Artist or designer' },
  { id: 'healthcare', label: 'Healthcare', icon: 'medical', description: 'Medical professional' },
  { id: 'other', label: 'Other', icon: 'person', description: 'Other occupation' },
];

export default function OccupationScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateOccupation, isLoading } = useOnboarding();
  const [selectedOccupation, setSelectedOccupation] = useState<string | null>(null);
  const scale = useSharedValue(1);

  const handleSelect = (id: string) => {
    scale.value = withSpring(1.05, {}, () => {
      scale.value = withSpring(1);
    });
    setSelectedOccupation(id);
  };

  const handleNext = async () => {
    if (!selectedOccupation) {
      toast.show("Please select your occupation", "error");
      return;
    }

    const success = await updateOccupation(selectedOccupation);
    if (success) {
      router.push('/onboarding/location');
    } else {
      toast.show("Failed to save occupation. Please try again.", "error");
    }
  };

  return (
    <View className="flex-1 bg-primary-light">
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 p-6"
      >
        <Text className="text-3xl font-bold mb-2 text-indigo-600">
          What do you do?
        </Text>
        <Text className="text-slate-500 mb-8">
          Select your occupation
        </Text>

        <View className="flex-row flex-wrap justify-between mt-4">
          {OCCUPATIONS.map((occupation, index) => (
            <Animated.View
              key={occupation.id}
              entering={FadeIn.delay(index * 200)}
              className="w-[48%] mb-6"
            >
              <TouchableOpacity
                onPress={() => handleSelect(occupation.id)}
                className={`p-4 rounded-3xl items-center justify-center shadow-sm ${
                  selectedOccupation === occupation.id 
                    ? 'bg-indigo-600' 
                    : 'bg-white border border-indigo-100'
                }`}
                style={{
                  elevation: selectedOccupation === occupation.id ? 8 : 2,
                }}
                disabled={isLoading}
              >
                <View className={`p-4 rounded-2xl ${
                  selectedOccupation === occupation.id 
                    ? 'bg-indigo-500' 
                    : 'bg-indigo-50'
                }`}>
                  <Ionicons 
                    name={occupation.icon as any} 
                    size={32} 
                    color={selectedOccupation === occupation.id ? '#fff' : '#6366f1'} 
                  />
                </View>
                <Text className={`mt-4 text-lg font-medium ${
                  selectedOccupation === occupation.id 
                    ? "text-white" 
                    : "text-slate-700"
                }`}>
                  {occupation.label}
                </Text>
                <Text className={`text-sm mt-1 ${
                  selectedOccupation === occupation.id
                    ? "text-indigo-100"
                    : "text-slate-500"
                }`}>
                  {occupation.description}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          disabled={!selectedOccupation || isLoading}
          className={`py-4 rounded-xl mt-8 shadow-sm ${
            selectedOccupation ? "bg-indigo-600" : "bg-slate-300"
          }`}
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
