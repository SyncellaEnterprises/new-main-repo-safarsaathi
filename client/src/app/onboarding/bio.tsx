import { View, Text, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  FadeInDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
  withTiming
} from "react-native-reanimated";
import React, { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";

export default function BioScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateBio, isLoading } = useOnboarding();
  const [bio, setBio] = useState("");
  const scale = useSharedValue(1);
  const progress = useSharedValue(0);
  const MAX_CHARS = 150;
  const MIN_CHARS = 30;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: interpolate(
      progress.value,
      [0, MIN_CHARS, MAX_CHARS],
      [0, 60, 100]
    ),
    height: 3,
    backgroundColor: bio.length >= MIN_CHARS ? '#10b981' : '#6366f1',
    borderRadius: 2,
  }));

  const handleBioChange = (text: string) => {
    if (text.length <= MAX_CHARS) {
      setBio(text);
      progress.value = withTiming(text.length);
      scale.value = withSpring(1.02, {}, () => {
        scale.value = withSpring(1);
      });
    }
  };

  const handleNext = async () => {
    if (bio.length < MIN_CHARS) {
      toast.show(`Please write at least ${MIN_CHARS} characters`, "error");
      return;
    }

    const success = await updateBio(bio.trim());
    if (success) {
      router.push('/onboarding/occupation');
    } else {
      toast.show("Failed to save bio. Please try again.", "error");
    }
  };

  return (
    <View className="flex-1 bg-primary-light">
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 p-6"
      >
        <Text className="text-3xl font-bold mb-2 text-indigo-600">
          Tell us about yourself
        </Text>
        <Text className="text-slate-500 mb-8">
          Write a bio that shows your personality
        </Text>

        <View className="mt-2 mb-4">
          <Animated.View style={progressStyle} />
          <View className="flex-row justify-between mt-2">
            <Text className="text-indigo-600 text-sm font-medium">
              Min {MIN_CHARS} characters
            </Text>
            <Text className="text-slate-500 text-sm">
              {bio.length}/{MAX_CHARS}
            </Text>
          </View>
        </View>

        <View className="flex-1">
          <View className="bg-white rounded-2xl p-4 shadow-sm border border-indigo-100">
            <TextInput
              value={bio}
              onChangeText={handleBioChange}
              placeholder="Write something interesting about yourself..."
              multiline
              className="text-base text-slate-700 min-h-[200]"
              maxLength={MAX_CHARS}
              editable={!isLoading}
            />
            <Text className={`${
              bio.length >= MIN_CHARS ? "text-green-600" : "text-indigo-600"
            } font-medium mt-2`}>
              {bio.length}/{MAX_CHARS} characters
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleNext}
          disabled={bio.length < MIN_CHARS || isLoading}
          className={`py-4 rounded-xl mt-auto ${
            bio.length >= MIN_CHARS ? 'bg-indigo-600' : 'bg-slate-300'
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
