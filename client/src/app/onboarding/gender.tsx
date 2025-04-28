import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInDown,
  FadeIn,
  SlideInRight,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
  ZoomIn,
  withRepeat,
  withTiming,
  Easing,
  Extrapolate
} from 'react-native-reanimated';
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';
import IMAGES from "@/src/constants/images";

const { width, height } = Dimensions.get('window');

const GENDER_OPTIONS = [
  { id: 'male', label: 'Male', icon: 'male' },
  { id: 'female', label: 'Female', icon: 'female' },
  { id: 'other', label: 'Other', icon: 'transgender' },
];

export default function GenderScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateGender, isLoading } = useOnboarding();
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
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

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingY1.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingY2.value }],
  }));

  const orb3Style = useAnimatedStyle(() => ({
    transform: [{ translateY: floatingY3.value }],
  }));

  const handleGenderSelect = (gender: string) => {
    setSelectedGender(gender);
    setSubmitError(null);
    scale.value = withSpring(1.02, {}, () => {
      scale.value = withSpring(1);
    });
  };

  const handleNext = async () => {
    if (!selectedGender) {
      setSubmitError("Please select your gender");
      toast.show("Please select your gender", "error");
      return;
    }

    try {
      setSubmitError(null);
      const success = await updateGender(selectedGender);
      if (success) {
        router.push('/onboarding/photos');
      } else {
        setSubmitError("Failed to save gender");
        toast.show("Failed to save gender. Please try again.", "error");
      }
    } catch (error) {
      console.error('Gender update error:', error);
      setSubmitError("An error occurred");
      toast.show("An error occurred. Please try again.", "error");
    }
  };

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
            <Text className="text-neutral-darkest font-montserratBold">GENDER</Text>
          </LinearGradient>
          
          <Text className="text-4xl font-bold text-white font-youngSerif">
            How do you identify?
          </Text>
          
          <Text className="text-neutral-medium mt-2 text-lg font-montserrat">
            Select your gender identity
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

        {/* Gender Options */}
        <View className="flex-1">
          {isSkeletonVisible ? (
            <View className="space-y-4">
              {[1, 2, 3].map((index) => (
                <Animated.View
                  key={index}
                  entering={FadeIn.delay(index * 200)}
                  className="bg-neutral-dark/50 rounded-3xl h-24"
                >
                  <LinearGradient
                    colors={['rgba(125, 91, 166, 0.1)', 'rgba(125, 91, 166, 0.2)', 'rgba(125, 91, 166, 0.1)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-full h-full rounded-3xl"
                  />
                </Animated.View>
              ))}
            </View>
          ) : (
            <View className="space-y-4">
              {GENDER_OPTIONS.map((option, index) => (
                <Animated.View
                  key={option.id}
                  entering={FadeInDown.delay(300 + index * 100).springify()}
                >
                  <TouchableOpacity
                    onPress={() => handleGenderSelect(option.id)}
                    activeOpacity={0.7}
                  >
                    <BlurView intensity={30} tint="dark" className="rounded-3xl overflow-hidden">
                      <LinearGradient
                        colors={
                          selectedGender === option.id
                            ? ['rgba(125, 91, 166, 0.3)', 'rgba(80, 166, 167, 0.2)']
                            : ['rgba(125, 91, 166, 0.1)', 'rgba(125, 91, 166, 0.05)']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        className="p-6 border border-primary-light/30"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <View className={`w-12 h-12 rounded-2xl items-center justify-center ${
                              selectedGender === option.id ? 'bg-primary' : 'bg-primary/20'
                            }`}>
                              <Ionicons 
                                name={option.icon as any} 
                                size={24} 
                                color={selectedGender === option.id ? 'white' : '#9D7EBD'} 
                              />
                            </View>
                            <Text className={`ml-4 text-xl font-youngSerif ${
                              selectedGender === option.id ? 'text-white' : 'text-neutral-light'
                            }`}>
                              {option.label}
                            </Text>
                          </View>
                          <View className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                            selectedGender === option.id 
                              ? 'border-primary bg-primary' 
                              : 'border-neutral-medium'
                          }`}>
                            {selectedGender === option.id && (
                              <Ionicons name="checkmark" size={16} color="white" />
                            )}
                          </View>
                        </View>
                      </LinearGradient>
                    </BlurView>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Gender Info Card */}
          <BlurView intensity={20} tint="dark" className="rounded-2xl mt-8 overflow-hidden">
            <LinearGradient
              colors={['rgba(125, 91, 166, 0.1)', 'rgba(157, 126, 189, 0.05)']}
              className="p-4 border border-primary-light/20"
              style={{ borderRadius: 16 }}
            >
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                  <Ionicons name="information-circle-outline" size={20} color="#9D7EBD" />
                </View>
                <View className="flex-1">
                  <Text className="text-neutral-light font-montserratMedium mb-1">Gender Identity</Text>
                  <Text className="text-neutral-medium text-sm font-montserrat">
                    Your gender helps us personalize your experience and find compatible travel companions.
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
              colors={selectedGender ? ['#7D5BA6', '#50A6A7'] : ['#3E3C47', '#3E3C47']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-xl overflow-hidden"
            >
              <TouchableOpacity
                onPress={handleNext}
                disabled={!selectedGender || isLoading || isSkeletonVisible}
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
