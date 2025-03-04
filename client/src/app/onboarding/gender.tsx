import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  FadeInDown, 
  FadeInRight,
  BounceIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue
} from "react-native-reanimated";
import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

const GENDERS = [
  { id: 'male', label: 'Male', icon: 'male' },
  { id: 'female', label: 'Female', icon: 'female' },
  { id: 'non-binary', label: 'Non-binary', icon: 'transgender' },
  { id: 'other', label: 'Other', icon: 'person' },
];

export default function GenderScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateGender, isLoading } = useOnboarding();
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const scale = useSharedValue(1);

  const handleSelect = (genderId: string) => {
    scale.value = withSpring(1.05, {}, () => {
      scale.value = withSpring(1);
    });
    setSelectedGender(genderId);
  };

  const handleNext = async () => {
    if (!selectedGender) {
      toast.show("Please select your gender", "error");
      return;
    }

    const success = await updateGender(selectedGender);
    if (success) {
      router.push('/onboarding/prompts');
      console.log(selectedGender)
    } else {
      toast.show("Failed to save gender. Please try again.", "error");
    }
  };

  return (
    <View className="flex-1 bg-primary-light">
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 p-6"
      >
        <Text className="text-3xl font-bold mb-2 text-indigo-600">
          How do you identify?
        </Text>
        <Text className="text-slate-500 mb-8">
          Let others know how you identify yourself
        </Text>

        <View className="flex-row flex-wrap justify-between mt-4">
          {GENDERS.map((gender, index) => (
            <Animated.View
              key={gender.id}
              entering={FadeInRight.delay(index * 200)}
              className="w-[48%] mb-6"
            >
              <TouchableOpacity
                onPress={() => handleSelect(gender.id)}
                className={`aspect-square rounded-3xl p-4 items-center justify-center shadow-sm ${
                  selectedGender === gender.id 
                    ? 'bg-indigo-600' 
                    : 'bg-white border border-indigo-100'
                }`}
                style={{
                  elevation: selectedGender === gender.id ? 8 : 2,
                }}
                disabled={isLoading}
              >
                <Animated.View
                  entering={BounceIn.delay(index * 200 + 500)}
                  className={`p-4 rounded-2xl ${
                    selectedGender === gender.id 
                      ? 'bg-indigo-500' 
                      : 'bg-indigo-50'
                  }`}
                >
                  <Ionicons 
                    name={gender.icon as any} 
                    size={44} 
                    color={selectedGender === gender.id ? '#fff' : '#6366f1'} 
                  />
                </Animated.View>
                <Text 
                  className={`mt-4 text-lg font-medium ${
                    selectedGender === gender.id ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {gender.label}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleNext}
          disabled={!selectedGender || isLoading}
          className={`py-4 rounded-xl mt-auto ${
            selectedGender ? 'bg-indigo-600' : 'bg-slate-300'
          } shadow-sm`}
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
