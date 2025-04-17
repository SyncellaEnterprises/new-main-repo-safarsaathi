import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Dimensions, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  FadeInDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
  withTiming,
  SlideInRight,
  FadeIn,
  ZoomIn
} from "react-native-reanimated";
import React, { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

export default function BioScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateBio, isLoading } = useOnboarding();
  const [bio, setBio] = useState("");
  const [isSkeletonVisible, setIsSkeletonVisible] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const scale = useSharedValue(1);
  const progress = useSharedValue(0);
  const scrollY = useSharedValue(0);
  const MIN_CHARS = 30;
  const MAX_CHARS = 150;

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSkeletonVisible(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 100],
          [0, -20],
          'clamp'
        ),
      },
    ],
    opacity: interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.9],
      'clamp'
    ),
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(
      progress.value,
      [0, MIN_CHARS, MAX_CHARS],
      [0, 60, 100]
    )}%`,
    height: 4,
    backgroundColor: bio.length >= MIN_CHARS ? '#50A6A7' : '#FF6B6B',
    borderRadius: 4,
  }));

  const handleBioChange = (text: string) => {
    setSubmitError(null);
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
      setSubmitError(`Please write at least ${MIN_CHARS} characters`);
      toast.show(`Please write at least ${MIN_CHARS} characters`, "error");
      return;
    }

    try {
      setSubmitError(null);
      const success = await updateBio(bio.trim());
      if (success) {
        router.push('/onboarding/occupation');
      } else {
        setSubmitError("Failed to save bio");
        toast.show("Failed to save bio. Please try again.", "error");
      }
    } catch (error) {
      console.error('Bio update error:', error);
      setSubmitError("An error occurred");
      toast.show("An error occurred. Please try again.", "error");
    }
  };

  const renderSkeleton = () => (
    <Animated.View
      entering={FadeIn}
      className="bg-neutral-dark/50 rounded-2xl overflow-hidden"
      style={{ height: 220 }}
    >
      <LinearGradient
        colors={['rgba(255, 107, 107, 0.1)', 'rgba(255, 142, 142, 0.2)', 'rgba(255, 107, 107, 0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="w-full h-full"
      />
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-neutral-darkest">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          scrollY.value = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <Animated.View 
          style={headerStyle}
          className="px-6 pt-6"
        >
          {/* Romantic Journey Progress */}
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-full bg-[#FF6B6B]/20 items-center justify-center">
              <Ionicons name="heart" size={16} color="#FF6B6B" />
            </View>
            <View className="flex-1 h-1 bg-neutral-dark/50 rounded-full ml-2">
              <View className="w-2/5 h-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] rounded-full" />
            </View>
          </View>

          {/* Header */}
          <View className="mb-6">
            <Text className="text-4xl font-youngSerif mb-3 text-white">
              Tell Your Story
            </Text>
            <Text className="text-lg text-neutral-light font-montserrat leading-relaxed">
              Write a bio that captures hearts and sparks connections
            </Text>
            
            {submitError && (
              <Animated.View 
                entering={SlideInRight}
                className="mt-4 bg-red-900/30 border border-red-500/30 rounded-xl p-4 flex-row items-center"
              >
                <Ionicons name="alert-circle" size={20} color="#f87171" />
                <Text className="text-red-400 ml-2 font-montserrat">{submitError}</Text>
              </Animated.View>
            )}
          </View>

          {/* Progress Bar */}
          <View className="mb-6">
            <View className="bg-neutral-dark/50 h-4 rounded-full overflow-hidden">
              <Animated.View style={progressStyle} />
            </View>
            <View className="flex-row items-center justify-between mt-3">
              <View className="flex-row items-center">
                <Ionicons name="text-outline" size={18} color="#FF6B6B" />
                <Text className="text-white font-montserratMedium ml-2">
                  {bio.length}/{MAX_CHARS} characters
                </Text>
              </View>
              <Text className={`text-sm font-montserrat ${bio.length >= MIN_CHARS ? 'text-[#50A6A7]' : 'text-neutral-medium'}`}>
                {bio.length >= MIN_CHARS ? '✓ Perfect length!' : `Min ${MIN_CHARS} characters`}
              </Text>
            </View>
          </View>

          {/* Bio Input Card */}
          <View className="mb-6">
            {isSkeletonVisible ? (
              renderSkeleton()
            ) : (
              <Animated.View 
                style={[{ transform: [{ scale: scale.value }] }]}
              >
                <BlurView intensity={20} tint="dark" className="rounded-2xl overflow-hidden">
                  <LinearGradient
                    colors={['rgba(255, 107, 107, 0.1)', 'rgba(255, 142, 142, 0.05)']}
                    className="p-5 border border-[#FF6B6B]/20"
                  >
                    <TextInput
                      value={bio}
                      onChangeText={handleBioChange}
                      placeholder="Share your passions, dreams, and what makes you unique..."
                      placeholderTextColor="#686680"
                      multiline
                      className="text-lg text-white min-h-[180] font-montserrat leading-relaxed"
                      maxLength={MAX_CHARS}
                      editable={!isLoading}
                      style={{ textAlignVertical: 'top' }}
                    />
                    <View className="flex-row justify-between items-center mt-3">
                      <Text className={`${
                        bio.length >= MIN_CHARS ? "text-[#50A6A7]" : "text-neutral-light"
                      } font-montserratMedium text-sm`}>
                        {bio.length}/{MAX_CHARS}
                      </Text>
                      {bio.length >= MIN_CHARS && (
                        <View className="bg-[#50A6A7]/20 px-3 py-1.5 rounded-full">
                          <Text className="text-[#50A6A7] text-xs font-montserratBold">Engaging Bio!</Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                </BlurView>
              </Animated.View>
            )}
          </View>

          {/* Writing Tips */}
          <BlurView intensity={20} tint="dark" className="rounded-2xl mb-6 overflow-hidden">
            <LinearGradient
              colors={['rgba(255, 107, 107, 0.1)', 'rgba(255, 142, 142, 0.05)']}
              className="p-5 border border-[#FF6B6B]/20"
            >
              <View className="flex-row items-start">
                <View className="w-12 h-12 rounded-full bg-[#FF6B6B]/20 items-center justify-center mr-4">
                  <Ionicons name="sparkles" size={24} color="#FF6B6B" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-montserratBold text-lg mb-2">Writing Tips</Text>
                  <Text className="text-neutral-light font-montserrat leading-relaxed">
                    • Share your travel experiences{'\n'}
                    • Mention your passions & hobbies{'\n'}
                    • Add a touch of humor{'\n'}
                    • Be authentic and genuine
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
        <View className="h-32" />
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View 
        entering={FadeInDown.delay(300)}
        className="absolute bottom-0 left-0 right-0 p-6 bg-neutral-darkest/80 backdrop-blur-xl border-t border-white/5"
      >
        <LinearGradient
          colors={bio.length >= MIN_CHARS 
            ? ['#FF6B6B', '#FF8E8E']
            : ['rgba(30, 27, 38, 0.8)', 'rgba(30, 27, 38, 0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="rounded-xl overflow-hidden"
        >
          <TouchableOpacity
            onPress={handleNext}
            disabled={bio.length < MIN_CHARS || isLoading}
            className="py-4 px-6"
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white ml-2 font-montserratBold">Saving your story...</Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-center">
                <Text className={`text-center text-lg font-montserratBold ${
                  bio.length >= MIN_CHARS ? 'text-white' : 'text-neutral-medium'
                }`}>
                  {bio.length < MIN_CHARS ? `Add ${MIN_CHARS - bio.length} more characters` : 'Continue Your Journey'}
                </Text>
                {bio.length >= MIN_CHARS && (
                  <Ionicons name="arrow-forward" size={20} color="white" className="ml-2" />
                )}
              </View>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}
