import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInDown, 
  FadeIn, 
  useAnimatedStyle, 
  withSpring,
  useSharedValue 
} from 'react-native-reanimated';
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { INTEREST_CATEGORIES } from '@/src/constants/interests';

export default function InterestsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateInterests, isLoading } = useOnboarding();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const MAX_INTERESTS = 8;
  const MIN_INTERESTS = 3;
  const scale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  const progressStyle = useAnimatedStyle(() => ({
   width: withSpring((100 * selectedInterests.length) / MAX_INTERESTS + '%'),
    height: 3,
    backgroundColor: selectedInterests.length >= MIN_INTERESTS ? '#10b981' : '#6366f1',
    borderRadius: 2,
  }));

  const handleSelect = (interest: string) => {
    scale.value = withSpring(1.05, {}, () => {
      scale.value = withSpring(1);
    });

    setSelectedInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      }
      if (prev.length >= MAX_INTERESTS) {
        toast.show(`Maximum ${MAX_INTERESTS} interests allowed`, "error");
        return prev;
      }
      return [...prev, interest];
    });
  };

  const handleNext = async () => {
    if (selectedInterests.length < MIN_INTERESTS) {
      toast.show(`Please select at least ${MIN_INTERESTS} interests`, "error");
      return;
    }

    const success = await updateInterests(selectedInterests);
    if (success) {
      router.push('/onboarding/gender');
    } else {
      toast.show("Failed to save interests. Please try again.", "error");
    }
  };

  return (
    <View className="flex-1 bg-primary-light">
      <ScrollView className="flex-1">
        <Animated.View 
          entering={FadeInDown.duration(1000).springify()}
          className="flex-1 p-6"
        >
          <Text className="text-3xl font-bold mb-2 text-indigo-600">
            What interests you?
          </Text>
          <Text className="text-slate-500 mb-4">
            Select {MIN_INTERESTS}-{MAX_INTERESTS} interests to help us find your perfect match
          </Text>

          <View className="mt-2 mb-6">
            <Animated.View style={progressStyle as any} />
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-indigo-600 font-medium">
                {selectedInterests.length}/{MAX_INTERESTS} selected
              </Text>
              {selectedInterests.length < MIN_INTERESTS && (
                <Text className="text-indigo-500 text-sm">
                  Select at least {MIN_INTERESTS}
                </Text>
              )}
            </View>
          </View>

          {INTEREST_CATEGORIES.map((category, categoryIndex) => (
            <Animated.View
              key={category.name}
              entering={FadeIn.delay(categoryIndex * 200)}
              className="mb-8"
            >
              <Text className="text-xl font-semibold mb-4 text-slate-700">
                {category.name}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {category.interests.map((interest, index) => (
                  <TouchableOpacity
                    key={interest}
                    onPress={() => handleSelect(interest)}
                    disabled={isLoading}
                    className={`px-4 py-2 rounded-full border ${
                      selectedInterests.includes(interest)
                        ? 'bg-indigo-600 border-indigo-500'
                        : 'bg-white border-indigo-100'
                    }`}
                  >
                    <Text className={
                      selectedInterests.includes(interest)
                        ? 'text-white'
                        : 'text-slate-700'
                    }>
                      {interest}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          ))}
        </Animated.View>
        <View className="h-24" />
      </ScrollView>

      <Animated.View 
        entering={FadeInDown.delay(300)}
        className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-indigo-100 shadow-lg"
      >
        <TouchableOpacity
          onPress={handleNext}
          disabled={selectedInterests.length < MIN_INTERESTS || isLoading}
          className={`py-4 rounded-xl shadow-sm ${
            selectedInterests.length >= MIN_INTERESTS
              ? 'bg-indigo-600' 
              : 'bg-slate-300'
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