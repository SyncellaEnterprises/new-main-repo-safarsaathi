import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInDown, 
  FadeIn,
  SlideInRight, 
  useAnimatedStyle, 
  withSpring,
  useSharedValue,
  ZoomIn,
  interpolate
} from 'react-native-reanimated';
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { INTEREST_CATEGORIES } from '@/src/constants/interests';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48 - 12) / 3; // 3 items per row, 12px gap, 24px padding on each side

export default function InterestsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateInterests, isLoading } = useOnboarding();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isSkeletonVisible, setIsSkeletonVisible] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>(INTEREST_CATEGORIES[0].name);
  
  const MAX_INTERESTS = 8;
  const MIN_INTERESTS = 3;
  const scale = useSharedValue(1);
  const progressWidth = useSharedValue(0);
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

  const progressStyle = useAnimatedStyle(() => ({
    width: `${withSpring((100 * selectedInterests.length) / MAX_INTERESTS)}%`,
    height: 4,
    backgroundColor: selectedInterests.length >= MIN_INTERESTS ? '#50A6A7' : '#FF6B6B',
    borderRadius: 4,
  }));

  const handleSelect = (interest: string) => {
    setSubmitError(null);
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
      setSubmitError(`Please select at least ${MIN_INTERESTS} interests`);
      toast.show(`Please select at least ${MIN_INTERESTS} interests`, "error");
      return;
    }

    try {
      setSubmitError(null);
      const success = await updateInterests(selectedInterests);
      if (success) {
        router.push('/onboarding/gender');
      } else {
        setSubmitError("Failed to save interests");
        toast.show("Failed to save interests. Please try again.", "error");
      }
    } catch (error) {
      console.error('Interest update error:', error);
      setSubmitError("An error occurred");
      toast.show("An error occurred. Please try again.", "error");
    }
  };
  
  const renderSkeletons = (count: number) => {
    return Array(count).fill(0).map((_, index) => (
      <Animated.View
        key={`skeleton-${index}`}
        entering={FadeIn.delay(index * 100)}
        style={{ 
          width: ITEM_SIZE, 
          height: 40, 
          marginBottom: 8, 
          borderRadius: 16,
          overflow: 'hidden'
        }}
        className="bg-neutral-dark/30"
      >
        <LinearGradient
          colors={['rgba(255, 107, 107, 0.1)', 'rgba(255, 142, 142, 0.2)', 'rgba(255, 107, 107, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-full h-full"
        />
      </Animated.View>
    ));
  };

  const getFilteredCategories = () => {
    if (activeCategory === 'All') {
      return INTEREST_CATEGORIES;
    }
    return INTEREST_CATEGORIES.filter(category => category.name === activeCategory);
  };

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
              <View className="w-1/5 h-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] rounded-full" />
            </View>
          </View>

          {/* Header */}
          <View className="mb-6">
            <Text className="text-4xl font-youngSerif mb-3 text-white">
              What Moves You?
            </Text>
            <Text className="text-lg text-neutral-light font-montserrat leading-relaxed">
              Choose interests that spark joy and connection
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

          {/* Progress Indicator */}
          <View className="mb-6">
            <View className="bg-neutral-dark/50 h-4 rounded-full overflow-hidden">
              <Animated.View style={progressStyle} />
            </View>
            <View className="flex-row items-center justify-between mt-3">
              <View className="flex-row items-center">
                <Ionicons name="heart-outline" size={18} color="#FF6B6B" />
                <Text className="text-white font-montserratMedium ml-2">
                  {selectedInterests.length}/{MAX_INTERESTS} selected
                </Text>
              </View>
              <Text className={`text-sm font-montserrat ${selectedInterests.length >= MIN_INTERESTS ? 'text-[#50A6A7]' : 'text-neutral-medium'}`}>
                {selectedInterests.length >= MIN_INTERESTS ? '✓ Great choices!' : `Select ${MIN_INTERESTS - selectedInterests.length} more`}
              </Text>
            </View>
          </View>

          {/* Selected Interests Pills */}
          {selectedInterests.length > 0 && (
            <BlurView intensity={20} tint="dark" className="rounded-2xl mb-6 overflow-hidden">
              <LinearGradient
                colors={['rgba(255, 107, 107, 0.1)', 'rgba(255, 142, 142, 0.05)']}
                className="p-5 border border-[#FF6B6B]/20"
              >
                <Text className="text-white font-montserratBold text-lg mb-3">Your Interests</Text>
                <View className="flex-row flex-wrap gap-2">
                  {selectedInterests.map((interest, index) => (
                    <Animated.View
                      key={interest}
                      entering={ZoomIn.delay(index * 50)}
                    >
                      <TouchableOpacity
                        onPress={() => handleSelect(interest)}
                        className="flex-row items-center bg-[#FF6B6B]/20 border border-[#FF6B6B] px-3 py-1.5 rounded-full"
                      >
                        <Text className="text-white font-montserratMedium mr-2">{interest}</Text>
                        <Ionicons name="close-circle" size={16} color="#FF6B6B" />
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </LinearGradient>
            </BlurView>
          )}

          {/* Category Tabs */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => setActiveCategory('All')}
                className={`px-4 py-2 rounded-full ${activeCategory === 'All' ? 'bg-[#FF6B6B]' : 'bg-neutral-dark'}`}
              >
                <Text className={`${activeCategory === 'All' ? 'text-white' : 'text-neutral-light'} font-montserratMedium`}>All</Text>
              </TouchableOpacity>
              {INTEREST_CATEGORIES.map((category) => (
                <TouchableOpacity
                  key={category.name}
                  onPress={() => setActiveCategory(category.name)}
                  className={`px-4 py-2 rounded-full ${activeCategory === category.name ? 'bg-[#FF6B6B]' : 'bg-neutral-dark'}`}
                >
                  <Text className={`${activeCategory === category.name ? 'text-white' : 'text-neutral-light'} font-montserratMedium`}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Interests by Category */}
          {isSkeletonVisible ? (
            <View className="flex-row flex-wrap gap-3 justify-between">
              {renderSkeletons(12)}
            </View>
          ) : (
            getFilteredCategories().map((category, categoryIndex) => (
              <Animated.View
                key={category.name}
                entering={FadeIn.delay(categoryIndex * 200)}
                className="mb-8"
              >
                <View className="flex-row items-center mb-4">
                  <LinearGradient
                    colors={['#FF6B6B', '#FF8E8E']}
                    className="w-6 h-6 rounded-full items-center justify-center mr-2"
                  >
                    <Text className="text-white font-montserratBold text-xs">{categoryIndex + 1}</Text>
                  </LinearGradient>
                  <Text className="text-xl font-youngSerif text-white">
                    {category.name}
                  </Text>
                </View>
                
                <View className="flex-row flex-wrap gap-y-2">
                  {category.interests.map((interest, index) => (
                    <Animated.View
                      key={interest}
                      entering={SlideInRight.delay(index * 50)}
                      style={{ width: '31%', marginRight: index % 3 === 2 ? 0 : '3.5%' }}
                    >
                      <TouchableOpacity
                        onPress={() => handleSelect(interest)}
                        disabled={isLoading}
                        className={`px-3 py-2.5 rounded-xl border items-center justify-center ${
                          selectedInterests.includes(interest)
                            ? 'bg-[#FF6B6B] border-[#FF6B6B]'
                            : 'bg-neutral-dark/70 border-[#FF6B6B]/20'
                        }`}
                      >
                        <Text 
                          className={`text-center ${
                            selectedInterests.includes(interest)
                              ? 'text-white font-montserratMedium'
                              : 'text-neutral-light font-montserrat'
                          }`}
                          numberOfLines={1}
                        >
                          {interest}
                        </Text>
                      </TouchableOpacity>
                    </Animated.View>
                  ))}
                </View>
              </Animated.View>
            ))
          )}
        </Animated.View>
        <View className="h-32" />
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View 
        entering={FadeInDown.delay(300)}
        className="absolute bottom-0 left-0 right-0 p-6 bg-neutral-darkest/80 backdrop-blur-xl border-t border-white/5"
      >
        <LinearGradient
          colors={selectedInterests.length >= MIN_INTERESTS 
            ? ['#FF6B6B', '#FF8E8E']
            : ['rgba(30, 27, 38, 0.8)', 'rgba(30, 27, 38, 0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="rounded-xl overflow-hidden"
        >
          <TouchableOpacity
            onPress={handleNext}
            disabled={selectedInterests.length < MIN_INTERESTS || isLoading}
            className="py-4 px-6"
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white ml-2 font-montserratBold">Finding your matches...</Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-center">
                <Text className={`text-center text-lg font-montserratBold ${
                  selectedInterests.length >= MIN_INTERESTS ? 'text-white' : 'text-neutral-medium'
                }`}>
                  {selectedInterests.length < MIN_INTERESTS ? `Select ${MIN_INTERESTS - selectedInterests.length} more interests` : 'Continue Your Journey'}
                </Text>
                {selectedInterests.length >= MIN_INTERESTS && (
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