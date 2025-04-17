import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  FadeInDown,
  FadeIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  ZoomIn,
  SlideInRight,
  interpolate
} from "react-native-reanimated";
import { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 48; // Full width cards
const CARD_HEIGHT = 100;

const OCCUPATIONS = [
  { 
    id: 'digital_nomad', 
    label: 'Digital Nomad', 
    icon: 'laptop-outline', 
    description: 'Working while traveling the world',
    gradientStart: '#FF6B6B',
    gradientEnd: '#FF8E8E',
    accent: '#FFE4E4'
  },
  { 
    id: 'travel_enthusiast', 
    label: 'Travel Enthusiast', 
    icon: 'airplane-outline', 
    description: 'Passionate about exploring new places',
    gradientStart: '#4FACFE',
    gradientEnd: '#00F2FE',
    accent: '#E4F7FF'
  },
  { 
    id: 'creative_soul', 
    label: 'Creative Soul', 
    icon: 'color-palette-outline', 
    description: 'Artist, designer, or content creator',
    gradientStart: '#A18CD1',
    gradientEnd: '#FBC2EB',
    accent: '#F5E6FF'
  },
  { 
    id: 'entrepreneur', 
    label: 'Entrepreneur', 
    icon: 'rocket-outline', 
    description: 'Building dreams & ventures',
    gradientStart: '#FF867C',
    gradientEnd: '#FF8C7F',
    accent: '#FFE8E6'
  },
  { 
    id: 'wellness_guru', 
    label: 'Wellness Guru', 
    icon: 'leaf-outline', 
    description: 'Health, fitness & mindfulness professional',
    gradientStart: '#84FAB0',
    gradientEnd: '#8FD3F4',
    accent: '#E6FFF4'
  },
  { 
    id: 'corporate_explorer', 
    label: 'Corporate Explorer', 
    icon: 'briefcase-outline', 
    description: 'Balancing career with wanderlust',
    gradientStart: '#6A11CB',
    gradientEnd: '#2575FC',
    accent: '#E6EEFF'
  },
  { 
    id: 'student_adventurer', 
    label: 'Student Adventurer', 
    icon: 'school-outline', 
    description: 'Learning & exploring life',
    gradientStart: '#FDA085',
    gradientEnd: '#F6D365',
    accent: '#FFF4E6'
  },
  { 
    id: 'free_spirit', 
    label: 'Free Spirit', 
    icon: 'compass-outline', 
    description: 'Living life on your own terms',
    gradientStart: '#7F7FD5',
    gradientEnd: '#91EAE4',
    accent: '#E6F9FF'
  }
];

export default function OccupationScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateOccupation, isLoading } = useOnboarding();
  const [selectedOccupation, setSelectedOccupation] = useState<string | null>(null);
  const [isSkeletonVisible, setIsSkeletonVisible] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const scale = useSharedValue(1);
  const scrollY = useSharedValue(0);

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

  const handleSelect = (id: string) => {
    setSubmitError(null);
    scale.value = withSpring(1.05, {}, () => {
      scale.value = withSpring(1);
    });
    setSelectedOccupation(id);
  };

  const handleNext = async () => {
    if (!selectedOccupation) {
      setSubmitError("Please select your lifestyle");
      toast.show("Please select your lifestyle", "error");
      return;
    }

    try {
      setSubmitError(null);
      const success = await updateOccupation(selectedOccupation);
      if (success) {
        router.push('/onboarding/location');
      } else {
        setSubmitError("Failed to save lifestyle");
        toast.show("Failed to save lifestyle. Please try again.", "error");
      }
    } catch (error) {
      console.error('Lifestyle update error:', error);
      setSubmitError("An error occurred");
      toast.show("An error occurred. Please try again.", "error");
    }
  };

  const renderSkeletons = () => (
    Array(4).fill(0).map((_, index) => (
      <Animated.View
        key={`skeleton-${index}`}
        entering={FadeIn.delay(index * 150)}
        style={{ height: CARD_HEIGHT }}
        className="mb-4 rounded-2xl overflow-hidden bg-neutral-dark/30"
      >
        <LinearGradient
          colors={['rgba(125, 91, 166, 0.1)', 'rgba(125, 91, 166, 0.2)', 'rgba(125, 91, 166, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-full h-full"
        />
      </Animated.View>
    ))
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
            <View className="w-8 h-8 rounded-full bg-primary/20 items-center justify-center">
              <Ionicons name="heart" size={16} color="#FF6B6B" />
            </View>
            <View className="flex-1 h-1 bg-neutral-dark/50 rounded-full ml-2">
              <View className="w-3/5 h-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] rounded-full" />
            </View>
          </View>

          {/* Header */}
          <View className="mb-6">
            <Text className="text-4xl font-youngSerif mb-3 text-white">
              What's your lifestyle?
            </Text>
            <Text className="text-lg text-neutral-light font-montserrat leading-relaxed">
              Tell us about your journey through life and love
            </Text>
          </View>

          {submitError && (
            <Animated.View 
              entering={SlideInRight}
              className="mb-6 bg-red-900/30 border border-red-500/30 rounded-xl p-4 flex-row items-center"
            >
              <Ionicons name="alert-circle" size={20} color="#f87171" />
              <Text className="text-red-400 ml-2 font-montserrat">{submitError}</Text>
            </Animated.View>
          )}

          {/* Inspiration Card */}
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
                  <Text className="text-white font-montserratBold text-lg mb-2">Find Your Match</Text>
                  <Text className="text-neutral-light font-montserrat leading-relaxed">
                    Your lifestyle helps us connect you with kindred spirits who share your path and passions
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Lifestyle Cards */}
        <View className="px-6 pb-32">
          {isSkeletonVisible ? (
            renderSkeletons()
          ) : (
            OCCUPATIONS.map((occupation, index) => (
              <Animated.View
                key={occupation.id}
                entering={ZoomIn.delay(index * 100)}
                className="mb-4"
              >
                <TouchableOpacity
                  onPress={() => handleSelect(occupation.id)}
                  disabled={isLoading}
                  className={`rounded-2xl border overflow-hidden ${
                    selectedOccupation === occupation.id 
                      ? 'border-2 border-white' 
                      : 'border border-white/10'
                  }`}
                  style={{ height: CARD_HEIGHT }}
                >
                  <LinearGradient
                    colors={selectedOccupation === occupation.id 
                      ? [occupation.gradientStart, occupation.gradientEnd]
                      : ['rgba(30, 27, 38, 0.8)', 'rgba(30, 27, 38, 0.6)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className="flex-1 p-4 flex-row items-center"
                  >
                    <View className={`w-16 h-16 rounded-xl items-center justify-center ${
                      selectedOccupation === occupation.id 
                        ? 'bg-white/20' 
                        : `bg-[${occupation.gradientStart}]/10`
                    }`}>
                      <Ionicons 
                        name={occupation.icon as any} 
                        size={28} 
                        color={selectedOccupation === occupation.id ? '#fff' : occupation.gradientStart} 
                      />
                    </View>
                    
                    <View className="flex-1 ml-4">
                      <Text className={`text-xl font-montserratBold mb-1 ${
                        selectedOccupation === occupation.id 
                          ? 'text-white' 
                          : 'text-neutral-light'
                      }`}>
                        {occupation.label}
                      </Text>
                      <Text className={`font-montserrat ${
                        selectedOccupation === occupation.id
                          ? 'text-white/90'
                          : 'text-neutral-medium'
                      }`}>
                        {occupation.description}
                      </Text>
                    </View>

                    {selectedOccupation === occupation.id && (
                      <View className="w-8 h-8 rounded-full bg-white items-center justify-center ml-2">
                        <Ionicons name="checkmark" size={20} color={occupation.gradientStart} />
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View 
        entering={FadeInDown.delay(300)}
        className="absolute bottom-0 left-0 right-0 p-6 bg-neutral-darkest/80 backdrop-blur-xl border-t border-white/5"
      >
        <LinearGradient
          colors={selectedOccupation 
            ? ['#FF6B6B', '#FF8E8E']
            : ['rgba(30, 27, 38, 0.8)', 'rgba(30, 27, 38, 0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="rounded-xl overflow-hidden"
        >
          <TouchableOpacity
            onPress={handleNext}
            disabled={!selectedOccupation || isLoading}
            className="py-4 px-6"
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white ml-2 font-montserratBold">Finding your path...</Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-center">
                <Text className={`text-center text-lg font-montserratBold ${
                  selectedOccupation ? 'text-white' : 'text-neutral-medium'
                }`}>
                  {selectedOccupation ? 'Continue Your Journey' : 'Choose Your Path'}
                </Text>
                {selectedOccupation && (
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
