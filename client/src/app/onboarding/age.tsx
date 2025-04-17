import { View, Text, TouchableOpacity, ActivityIndicator, Dimensions } from "react-native";
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
  useAnimatedScrollHandler,
  Extrapolation
} from "react-native-reanimated";
import { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

export default function AgeScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateAge, isLoading } = useOnboarding();
  const [age, setAge] = useState(25);
  const [isSkeletonVisible, setIsSkeletonVisible] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const scrollY = useSharedValue(0);
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
    transform: [
      { scale: scale.value },
      { rotateZ: `${rotation.value}deg` }
    ]
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

  const headerStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        scrollY.value,
        [0, 100],
        [1, 0.8],
        Extrapolation.CLAMP
      ),
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [0, 100],
            [0, -10],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const handleAgeChange = (increment: boolean) => {
    setSubmitError(null);
    scale.value = withSpring(1.2, {}, () => {
      scale.value = withSpring(1);
    });
    
    rotation.value = withSpring(increment ? 5 : -5, {}, () => {
      rotation.value = withSpring(0);
    });
    
    setAge(current => {
      const newAge = increment ? current + 1 : current - 1;
      if (newAge < 18) {
        toast.show("Minimum age is 18", "error");
        return current;
      }
      if (newAge > 100) {
        toast.show("Maximum age is 100", "error");
        return current;
      }
      return newAge;
    });
  };

  const handleNext = async () => {
    if (age < 18) {
      setSubmitError("You must be 18 or older");
      toast.show("You must be 18 or older", "error");
      return;
    }

    try {
      setSubmitError(null);
      const success = await updateAge(age);
      if (success) {
        router.push('/onboarding/bio');
      } else {
        setSubmitError("Failed to save age");
        toast.show("Failed to save age. Please try again.", "error");
      }
    } catch (error) {
      console.error('Age update error:', error);
      setSubmitError("An error occurred");
      toast.show("An error occurred. Please try again.", "error");
    }
  };

  const getAgeCategory = () => {
    if (age < 25) return { label: "Gen Z", icon: "rocket-outline", color: "#50A6A7" };
    if (age < 40) return { label: "Millennial", icon: "game-controller-outline", color: "#7D5BA6" };
    if (age < 60) return { label: "Gen X", icon: "musical-notes-outline", color: "#9D7EBD" };
    return { label: "Baby Boomer", icon: "library-outline", color: "#B09DCE" };
  };

  const ageCategory = getAgeCategory();

  return (
    <View className="flex-1 bg-neutral-darkest">
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
        style={headerStyle}
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
            <Text className="text-neutral-darkest font-montserratBold">AGE</Text>
          </LinearGradient>
          
          <Text className="text-4xl font-bold text-white font-youngSerif">
            How young are you?
          </Text>
          
          <Text className="text-neutral-medium mt-2 text-lg font-montserrat">
            Let others know your age range
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

        {/* Age Display Card */}
        <View className="items-center">
          {isSkeletonVisible ? (
            <Animated.View
              entering={FadeIn}
              className="bg-neutral-dark/50 rounded-3xl overflow-hidden"
              style={{ width: width - 48, height: width - 48 }}
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
              className="mb-8"
            >
              <BlurView intensity={30} tint="dark" className="rounded-3xl overflow-hidden">
                <LinearGradient
                  colors={['rgba(125, 91, 166, 0.2)', 'rgba(125, 91, 166, 0.05)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  className="w-80 h-80 items-center justify-center border border-primary-light/30"
                  style={{ borderRadius: 24 }}
                >
                  <Animated.Text 
                    entering={ZoomIn}
                    className="text-9xl font-bold text-primary font-youngSerif"
                  >
                    {age}
                  </Animated.Text>
                  
                  <View className="flex-row items-center mt-4 bg-primary/20 px-4 py-2 rounded-full">
                    <Ionicons name={ageCategory.icon as any} size={20} color={ageCategory.color} />
                    <Text className="text-white font-montserratMedium ml-2">
                      {ageCategory.label}
                    </Text>
                  </View>

                  <View className="absolute top-6 right-6">
                    <BlurView intensity={40} tint="dark" className="rounded-xl overflow-hidden">
                      <LinearGradient
                        colors={['rgba(125, 91, 166, 0.3)', 'rgba(80, 166, 167, 0.2)']}
                        className="px-3 py-2 border border-primary-light/30"
                      >
                        <Text className="text-white font-montserratMedium text-sm">
                          {age >= 18 ? '✓ Valid Age' : 'Must be 18+'}
                        </Text>
                      </LinearGradient>
                    </BlurView>
                  </View>
                </LinearGradient>
              </BlurView>
            </Animated.View>
          )}

          {/* Age Controls */}
          <View className="flex-row items-center justify-center space-x-8 mt-8">
            <TouchableOpacity
              onPress={() => handleAgeChange(false)}
              className="bg-neutral-dark h-16 w-16 rounded-full items-center justify-center border border-primary-light/30 shadow-lg"
              disabled={isLoading || isSkeletonVisible}
            >
              <LinearGradient
                colors={['rgba(125, 91, 166, 0.2)', 'rgba(125, 91, 166, 0.05)']}
                className="w-full h-full rounded-full items-center justify-center"
              >
                <Ionicons name="remove" size={30} color="#9D7EBD" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleAgeChange(true)}
              className="bg-neutral-dark h-16 w-16 rounded-full items-center justify-center border border-primary-light/30 shadow-lg"
              disabled={isLoading || isSkeletonVisible}
            >
              <LinearGradient
                colors={['rgba(125, 91, 166, 0.2)', 'rgba(125, 91, 166, 0.05)']}
                className="w-full h-full rounded-full items-center justify-center"
              >
                <Ionicons name="add" size={30} color="#9D7EBD" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Age Facts Card */}
        <BlurView intensity={20} tint="dark" className="rounded-2xl mt-10 mb-6 overflow-hidden">
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
                <Text className="text-neutral-light font-montserratMedium mb-1">Age Preference</Text>
                <Text className="text-neutral-medium text-sm font-montserrat">
                  Your age helps us match you with people in appropriate age ranges. We only show your age to potential matches.
                </Text>
              </View>
            </View>
          </LinearGradient>
        </BlurView>

        {/* Continue Button */}
        <View className="mt-auto">
          <BlurView intensity={30} tint="dark" className="overflow-hidden rounded-xl">
            <LinearGradient
              colors={age >= 18 ? ['#7D5BA6', '#50A6A7'] : ['#3E3C47', '#3E3C47']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              className="rounded-xl overflow-hidden"
            >
              <TouchableOpacity
                onPress={handleNext}
                disabled={age < 18 || isLoading || isSkeletonVisible}
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
