import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions, Image, TextInput } from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  FadeInDown,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  SlideInRight,
  FadeIn,
  ZoomIn,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
  Extrapolation
} from "react-native-reanimated";
import { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import IMAGES from "@/src/constants/images";

const { width, height } = Dimensions.get('window');
const MAX_BIO_LENGTH = 500;

export default function BioScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateBio, isLoading } = useOnboarding();
  const [bio, setBio] = useState("");
  const [isSkeletonVisible, setIsSkeletonVisible] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const scale = useSharedValue(1);
  const floatingY1 = useSharedValue(0);
  const floatingY2 = useSharedValue(0);
  const floatingY3 = useSharedValue(0);

  // Floating animation for orbs
  useEffect(() => {
    floatingY1.value = withRepeat(
      withTiming(20, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    floatingY2.value = withRepeat(
      withTiming(-20, { duration: 2500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
    floatingY3.value = withRepeat(
      withTiming(15, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );
  }, []);

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

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingY1.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingY2.value }],
  }));

  const orb3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingY3.value }],
  }));

  const handleBioChange = (text: string) => {
    if (text.length <= MAX_BIO_LENGTH) {
      setSubmitError(null);
      setBio(text);
      scale.value = withSpring(1.02, {}, () => {
        scale.value = withSpring(1);
      });
    }
  };

  const handleNext = async () => {
    if (bio.trim().length < 50) {
      setSubmitError("Please write at least 50 characters");
      toast.show("Please write at least 50 characters", "error");
      return;
    }

    try {
      setSubmitError(null);
      const success = await updateBio(bio.trim());
      if (success) {
        router.push('/onboarding/interests');
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

  const getBioQuality = () => {
    const length = bio.trim().length;
    if (length === 0) return { label: "Start Writing", icon: "create-outline", color: "#50A6A7" };
    if (length < 50) return { label: "Keep Going", icon: "pencil-outline", color: "#7D5BA6" };
    if (length < 200) return { label: "Good Length", icon: "checkmark-circle-outline", color: "#9D7EBD" };
    return { label: "Perfect!", icon: "star-outline", color: "#B09DCE" };
  };

  const bioQuality = getBioQuality();

  return (
    <View className="flex-1 bg-neutral-darkest">
      {/* Background Pattern */}
      <Image
        source={IMAGES.patternBg}
        className="absolute inset-0 w-full h-full opacity-10"
        resizeMode="cover"
      />

      {/* Floating Orbs */}
      <Animated.View style={[{
        position: 'absolute',
        top: height * 0.1,
        right: 40,
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(125, 91, 166, 0.2)',
        zIndex: -1,
      }, orb1Style]} />
      
      <Animated.View style={[{
        position: 'absolute',
        top: height * 0.3,
        left: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(80, 166, 167, 0.15)',
        zIndex: -1,
      }, orb2Style]} />
      
      <Animated.View style={[{
        position: 'absolute',
        bottom: height * 0.2,
        right: -30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(157, 126, 189, 0.1)',
        zIndex: -1,
      }, orb3Style]} />

      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 p-6"
      >
        {/* Header */}
        <View className="mb-8">
          <LinearGradient
            colors={['#9D7EBD', '#50A6A7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="self-start rounded-xl px-4 py-1 mb-2"
          >
            <Text className="text-neutral-darkest font-montserratBold">BIO</Text>
          </LinearGradient>
          
          <Text className="text-4xl font-bold text-white font-youngSerif">
            Tell your story
          </Text>
          
          <Text className="text-neutral-medium mt-2 text-lg font-montserrat">
            Share what makes you unique
          </Text>
          
          {submitError && (
            <Animated.View 
              entering={SlideInRight}
              className="mt-4 bg-red-900/30 border border-red-500/30 rounded-xl p-3 flex-row items-center"
            >
              <Ionicons name="alert-circle" size={22} color="#f87171" />
              <Text className="text-red-400 ml-2 font-montserrat">{submitError}</Text>
            </Animated.View>
          )}
        </View>

        {/* Bio Input Card */}
        <View className="flex-1">
          {isSkeletonVisible ? (
            <Animated.View
              entering={FadeIn}
              className="bg-neutral-dark/50 rounded-3xl overflow-hidden flex-1"
            >
              <LinearGradient
                colors={['rgba(125, 91, 166, 0.1)', 'rgba(125, 91, 166, 0.2)', 'rgba(125, 91, 166, 0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-full h-full"
              />
            </Animated.View>
          ) : (
            <Animated.View 
              style={animatedStyle}
              className="flex-1"
            >
              <BlurView intensity={30} tint="dark" className="rounded-3xl overflow-hidden flex-1">
                <LinearGradient
                  colors={['rgba(125, 91, 166, 0.2)', 'rgba(125, 91, 166, 0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="flex-1 border border-primary-light/30 p-4"
                  style={{ borderRadius: 24 }}
                >
                  <TextInput
                    multiline
                    placeholder="I'm a passionate traveler who loves..."
                    placeholderTextColor="rgba(255, 255, 255, 0.3)"
                    value={bio}
                    onChangeText={handleBioChange}
                    className="text-white font-montserrat text-lg flex-1"
                    style={{ textAlignVertical: 'top' }}
                  />
                  
                  <View className="flex-row items-center justify-between mt-4">
                    <View className="flex-row items-center bg-primary/20 px-4 py-2 rounded-full">
                      <Ionicons name={bioQuality.icon as any} size={20} color={bioQuality.color} />
                      <Text className="text-white font-montserratMedium ml-2">
                        {bioQuality.label}
                      </Text>
                    </View>

                    <Text className="text-neutral-medium font-montserrat">
                      {bio.length}/{MAX_BIO_LENGTH}
                    </Text>
                  </View>
                </LinearGradient>
              </BlurView>
            </Animated.View>
          )}

          {/* Bio Tips Card */}
          <BlurView intensity={20} tint="dark" className="rounded-2xl mt-6 overflow-hidden">
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
                  <Text className="text-neutral-light font-montserratMedium mb-1">Writing Tips</Text>
                  <Text className="text-neutral-medium text-sm font-montserrat">
                    Share your interests, hobbies, and what you're looking for in a travel companion. Be authentic and let your personality shine!
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        {/* Continue Button */}
        <View className="mt-6">
          <BlurView intensity={30} tint="dark" className="overflow-hidden rounded-xl">
            <LinearGradient
              colors={bio.trim().length >= 50 ? ['#7D5BA6', '#50A6A7'] : ['#3E3C47', '#3E3C47']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-xl overflow-hidden"
            >
              <TouchableOpacity
                onPress={handleNext}
                disabled={bio.trim().length < 50 || isLoading || isSkeletonVisible}
                className="py-4 px-6"
              >
                {isLoading ? (
                  <View className="flex-row items-center justify-center">
                    <ActivityIndicator color="white" size="small" />
                    <Text className="text-white ml-2 font-montserratBold">Saving...</Text>
                  </View>
                ) : (
                  <View className="flex-row items-center justify-center">
                    <Text className="text-white text-center text-lg font-montserratBold">
                      Continue
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="white" className="ml-2" />
                  </View>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </BlurView>
        </View>
      </Animated.View>
    </View>
  );
}
