import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  FadeInDown, 
  FadeInRight,
  BounceIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  SlideInRight,
  FadeIn,
  ZoomIn
} from "react-native-reanimated";
import { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2; // 2 items per row, 16px gap, 24px padding on each side
const CARD_HEIGHT = 160;

const GENDERS = [
  { 
    id: 'male', 
    label: 'Male', 
    icon: 'male',
    gradientStart: '#5A4180',
    gradientEnd: '#7D5BA6'
  },
  { 
    id: 'female', 
    label: 'Female', 
    icon: 'female',
    gradientStart: '#7D5BA6',
    gradientEnd: '#9D7EBD'
  },
  { 
    id: 'non-binary', 
    label: 'Non-binary', 
    icon: 'transgender',
    gradientStart: '#50A6A7',
    gradientEnd: '#78C4C4'
  },
  { 
    id: 'other', 
    label: 'Other', 
    icon: 'person',
    gradientStart: '#9D7EBD',
    gradientEnd: '#B09DCE'
  },
];

export default function GenderScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateGender, isLoading } = useOnboarding();
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [isSkeletonVisible, setIsSkeletonVisible] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const scale = useSharedValue(1);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSkeletonVisible(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleSelect = (genderId: string) => {
    setSubmitError(null);
    scale.value = withSpring(1.05, {}, () => {
      scale.value = withSpring(1);
    });
    setSelectedGender(genderId);
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
        router.push('/onboarding/prompts');
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

  // Render skeleton loaders for gender cards
  const renderSkeletons = () => {
    return Array(4).fill(0).map((_, index) => (
      <Animated.View
        key={`skeleton-${index}`}
        entering={FadeIn.delay(index * 150)}
        style={{ 
          width: CARD_WIDTH, 
          height: CARD_HEIGHT, 
          marginBottom: 16,
          borderRadius: 24,
          overflow: 'hidden'
        }}
        className="bg-neutral-dark/30"
      >
        <LinearGradient
          colors={['rgba(125, 91, 166, 0.1)', 'rgba(125, 91, 166, 0.2)', 'rgba(125, 91, 166, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-full h-full"
        />
      </Animated.View>
    ));
  };

  return (
    <View className="flex-1 bg-neutral-darkest">
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 p-6"
      >
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold mb-2 text-primary font-youngSerif">
            How do you identify?
          </Text>
          <Text className="text-neutral-medium mb-1 font-montserrat">
            Let others know how you identify yourself
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

        {/* Gender Identity Info Card */}
        <BlurView intensity={20} tint="dark" className="rounded-2xl mb-6 overflow-hidden">
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
                <Text className="text-neutral-light font-montserratMedium mb-1">Gender Preference</Text>
                <Text className="text-neutral-medium text-sm font-montserrat">
                  This helps us show you relevant matches. You can change this setting later.
                </Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>

        {/* Gender Cards */}
        <View className="flex-row flex-wrap justify-between mt-4">
          {isSkeletonVisible ? (
            renderSkeletons()
          ) : (
            GENDERS.map((gender, index) => (
              <Animated.View
                key={gender.id}
                entering={ZoomIn.delay(index * 150)}
                className="mb-6"
                style={{ width: CARD_WIDTH }}
              >
                <TouchableOpacity
                  onPress={() => handleSelect(gender.id)}
                  className={`rounded-3xl border shadow-lg overflow-hidden ${
                    selectedGender === gender.id 
                      ? 'border-primary' 
                      : 'border-primary-light/20'
                  }`}
                  style={{
                    elevation: selectedGender === gender.id ? 8 : 2,
                    height: CARD_HEIGHT,
                    transform: [{ scale: selectedGender === gender.id ? 1.05 : 1 }]
                  }}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={selectedGender === gender.id 
                      ? [gender.gradientStart, gender.gradientEnd] 
                      : ['rgba(30, 27, 38, 0.8)', 'rgba(30, 27, 38, 0.6)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-full h-full p-4 items-center justify-center"
                  >
                    <Animated.View
                      entering={BounceIn.delay(index * 200 + 500)}
                      className={`p-4 rounded-full ${
                        selectedGender === gender.id 
                          ? 'bg-white/20' 
                          : 'bg-primary/10'
                      }`}
                    >
                      <Ionicons 
                        name={gender.icon as any} 
                        size={40} 
                        color={selectedGender === gender.id ? '#fff' : '#9D7EBD'} 
                      />
                    </Animated.View>
                    <Text className={`mt-4 text-lg font-montserratBold ${
                      selectedGender === gender.id ? 'text-white' : 'text-neutral-light'
                    }`}>
                      {gender.label}
                    </Text>
                    
                    {selectedGender === gender.id && (
                      <View className="absolute top-3 right-3 bg-white rounded-full p-1">
                        <Ionicons name="checkmark-circle" size={20} color="#50A6A7" />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </View>

        {/* Continue Button */}
        <View className="mt-auto">
          <LinearGradient
            colors={selectedGender ? ['#7D5BA6', '#9D7EBD'] : ['#3E3C47', '#3E3C47']}
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
                  <Text className={`text-center text-lg font-montserratBold ${
                    selectedGender ? 'text-white' : 'text-neutral-medium'
                  }`}>
                    {selectedGender ? 'Continue' : 'Select your gender'}
                  </Text>
                  {selectedGender && (
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
