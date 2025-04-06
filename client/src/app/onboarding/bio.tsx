import { View, Text, TouchableOpacity, TextInput, ActivityIndicator, Dimensions } from "react-native";
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
  const MIN_CHARS = 30;
  const MAX_CHARS = 150;

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSkeletonVisible(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${interpolate(
      progress.value,
      [0, MIN_CHARS, MAX_CHARS],
      [0, 60, 100]
    )}%`,
    height: 4,
    backgroundColor: bio.length >= MIN_CHARS ? '#50A6A7' : '#7D5BA6',
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

  // Render skeleton loader
  const renderSkeleton = () => (
    <Animated.View
      entering={FadeIn}
      className="bg-neutral-dark/50 rounded-2xl overflow-hidden"
      style={{ height: 220 }}
    >
      <LinearGradient
        colors={['rgba(125, 91, 166, 0.1)', 'rgba(125, 91, 166, 0.2)', 'rgba(125, 91, 166, 0.1)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="w-full h-full"
      />
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-neutral-darkest">
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 p-6"
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold mb-2 text-primary font-youngSerif">
            Tell us about yourself
          </Text>
          <Text className="text-neutral-medium mb-1 font-montserrat">
            Write a bio that shows your personality
          </Text>
          
          {submitError && (
            <Animated.View 
              entering={SlideInRight}
              className="mt-3 bg-red-900/30 border border-red-500/30 rounded-lg p-3 flex-row items-center"
            >
              <Ionicons name="alert-circle" size={20} color="#f87171" />
              <Text className="text-red-400 ml-2 font-montserrat">{submitError}</Text>
            </Animated.View>
          )}
        </View>

        {/* Progress Bar */}
        <View className="mt-2 mb-4">
          <View className="bg-neutral-dark/50 h-4 rounded-full overflow-hidden">
            <Animated.View style={progressStyle} />
          </View>
          <View className="flex-row items-center justify-between mt-3">
            <View className="flex-row items-center">
              <Ionicons name="text-outline" size={18} color="#9D7EBD" />
              <Text className="text-primary-light font-montserratMedium ml-2">
                Min {MIN_CHARS} characters
              </Text>
            </View>
            <Text className={`text-sm font-montserrat ${bio.length >= MIN_CHARS ? 'text-secondary' : 'text-neutral-medium'}`}>
              {bio.length}/{MAX_CHARS}
            </Text>
          </View>
        </View>

        {/* Bio Input Card */}
        <View className="flex-1">
          {isSkeletonVisible ? (
            renderSkeleton()
          ) : (
            <Animated.View 
              style={animatedStyle}
              className="flex-1"
            >
              <BlurView intensity={10} tint="dark" className="rounded-2xl overflow-hidden flex-1">
                <LinearGradient
                  colors={['rgba(125, 91, 166, 0.1)', 'rgba(125, 91, 166, 0.05)']}
                  className="p-4 border border-primary-light/30 flex-1 rounded-2xl"
                >
                  <TextInput
                    value={bio}
                    onChangeText={handleBioChange}
                    placeholder="Write something interesting about yourself..."
                    placeholderTextColor="#686680"
                    multiline
                    className="text-base text-neutral-light min-h-[200] font-montserrat"
                    maxLength={MAX_CHARS}
                    editable={!isLoading}
                    style={{ textAlignVertical: 'top' }}
                  />
                  <View className="flex-row justify-between items-center mt-2">
                    <Text className={`${
                      bio.length >= MIN_CHARS ? "text-secondary" : "text-primary-light"
                    } font-montserratMedium text-sm`}>
                      {bio.length}/{MAX_CHARS} characters
                    </Text>
                    {bio.length >= MIN_CHARS && (
                      <View className="bg-secondary/20 px-2 py-1 rounded-full">
                        <Text className="text-secondary text-xs font-montserratBold">Good length</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              </BlurView>
            </Animated.View>
          )}
        </View>

        {/* Tips Card */}
        <BlurView intensity={20} tint="dark" className="rounded-2xl mt-6 mb-6 overflow-hidden">
          <LinearGradient
            colors={['rgba(125, 91, 166, 0.1)', 'rgba(157, 126, 189, 0.05)']}
            className="p-4 border border-primary-light/20"
            style={{ borderRadius: 16 }}
          >
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                <Ionicons name="bulb-outline" size={20} color="#9D7EBD" />
              </View>
              <View className="flex-1">
                <Text className="text-neutral-light font-montserratMedium mb-1">Bio Tips</Text>
                <Text className="text-neutral-medium text-sm font-montserrat">
                  Mention your interests, hobbies, and something unique about yourself. Authentic bios help create meaningful connections.
                </Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>

        {/* Continue Button */}
        <View className="mt-auto">
          <LinearGradient
            colors={bio.length >= MIN_CHARS ? ['#7D5BA6', '#9D7EBD'] : ['#3E3C47', '#3E3C47']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-xl overflow-hidden"
          >
            <TouchableOpacity
              onPress={handleNext}
              disabled={bio.length < MIN_CHARS || isLoading || isSkeletonVisible}
              className="py-4 px-6"
            >
              {isLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white ml-2 font-montserratBold">Saving...</Text>
                </View>
              ) : (
                <View className="flex-row items-center justify-center">
                  <Text className={`text-center text-lg font-montserratBold ${
                    bio.length >= MIN_CHARS ? 'text-white' : 'text-neutral-medium'
                  }`}>
                    {bio.length < MIN_CHARS ? `Add ${MIN_CHARS - bio.length} more characters` : 'Continue'}
                  </Text>
                  {bio.length >= MIN_CHARS && (
                    <Ionicons name="arrow-forward" size={20} color="white" className="ml-2" />
                  )}
                </View>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Animated.View>
    </View>
  );
}
