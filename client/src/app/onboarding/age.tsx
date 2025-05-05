import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, StatusBar, Image, Dimensions, PanResponder } from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  FadeIn, 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSpring, 
  withSequence,
  interpolateColor,
  interpolate,
  Extrapolate
} from "react-native-reanimated";
import { useState, useRef, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import IMAGES from "@/src/constants/images";

const { width } = Dimensions.get("window");
const MIN_AGE = 18;
const MAX_AGE = 70;
const SLIDER_WIDTH = width - 48;

export default function AgeScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateAge, isLoading } = useOnboarding();
  const [age, setAge] = useState(25);
  const [error, setError] = useState(false);
  const [compliment, setCompliment] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);
  
  const sliderPosition = useSharedValue((age - MIN_AGE) / (MAX_AGE - MIN_AGE) * SLIDER_WIDTH);
  const ageScale = useSharedValue(1);
  const buttonScale = useSharedValue(1);
  const complimentOpacity = useSharedValue(0);
  
  // Get age-based compliment
  const getCompliment = (age: number) => {
    if (age >= 18 && age <= 25) {
      return "Young, energetic, and ready to explore the world!";
    } else if (age > 25 && age <= 35) {
      return "Perfect age for adventure and making new connections!";
    } else if (age > 35 && age <= 50) {
      return "Experienced traveler with wisdom to share!";
    } else {
      return "Age is just a number for passionate explorers like you!";
    }
  };

  useEffect(() => {
    // Update slider position when age changes
    sliderPosition.value = withTiming(((age - MIN_AGE) / (MAX_AGE - MIN_AGE)) * SLIDER_WIDTH);
    
    // Animate age number
    ageScale.value = withSequence(
      withSpring(1.2),
      withSpring(1)
    );
    
    // Update compliment with animation
    if (hasInteracted) {
      complimentOpacity.value = withSequence(
        withTiming(0, { duration: 300 }),
        withTiming(1, { duration: 500 })
      );
      setCompliment(getCompliment(age));
    }
  }, [age]);
  
  // Easter egg for specific ages
  useEffect(() => {
    if (age === 42) {
      toast.show("42 - The answer to life, the universe, and everything!", "success");
    }
  }, [age]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setHasInteracted(true);
      },
      onPanResponderMove: (_, gestureState) => {
        const newPosition = Math.max(0, Math.min(SLIDER_WIDTH, gestureState.moveX - 24));
        sliderPosition.value = newPosition;
        const newAge = Math.round(MIN_AGE + (newPosition / SLIDER_WIDTH) * (MAX_AGE - MIN_AGE));
        handleAgeChange(newAge);
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  const animatedThumbStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      sliderPosition.value,
      [0, SLIDER_WIDTH / 2, SLIDER_WIDTH],
      ['#FF7675', '#FFA69E', '#66A4A4']
    );
    
    return {
      transform: [
        { translateX: sliderPosition.value },
        { 
          scale: interpolate(
            sliderPosition.value, 
            [0, SLIDER_WIDTH], 
            [0.9, 1.1],
            Extrapolate.CLAMP
          ) 
        }
      ],
      backgroundColor
    };
  });

  const animatedFillStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      sliderPosition.value,
      [0, SLIDER_WIDTH],
      ['#FF9AA2', '#00CEC9']
    );
    
    return {
      width: sliderPosition.value,
      backgroundColor
    };
  });
  
  const animatedAgeStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: ageScale.value }]
    };
  });
  
  const animatedComplimentStyle = useAnimatedStyle(() => {
    return {
      opacity: complimentOpacity.value,
      transform: [
        { 
          translateY: interpolate(
            complimentOpacity.value,
            [0, 1],
            [10, 0],
            Extrapolate.CLAMP
          )
        }
      ]
    };
  });
  
  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: buttonScale.value }]
    };
  });

  const handleAgeChange = (newAge: number) => {
    if (newAge < MIN_AGE) {
      setError(true);
      setAge(MIN_AGE);
      return;
    }
    
    if (newAge > MAX_AGE) {
      setAge(MAX_AGE);
      return;
    }
    
    setError(false);
    setAge(newAge);
  };
  
  const increaseAge = () => {
    if (age < MAX_AGE) {
      setHasInteracted(true);
      handleAgeChange(age + 1);
    }
  };
  
  const decreaseAge = () => {
    if (age > MIN_AGE) {
      setHasInteracted(true);
      handleAgeChange(age - 1);
    }
  };

  const handleContinue = async () => {
    if (age < MIN_AGE) {
      setError(true);
      toast.show("You must be at least 18 years old to use SafarSaathi.", "error");
      return;
    }

    // Button press animation
    buttonScale.value = withSequence(
      withSpring(0.95),
      withSpring(1)
    );

    try {
      const success = await updateAge(age);
      if (success) {
        router.push('/onboarding/bio');
      } else {
        toast.show("Failed to save age. Please try again.", "error");
      }
    } catch (error) {
      console.error('Age update error:', error);
      toast.show("An error occurred. Please try again.", "error");
    }
  };
  
  // Generate background pattern elements
  const renderPatternElements = () => {
    return (
      <View style={styles.patternContainer} pointerEvents="none">
        <View style={[styles.patternElement, styles.patternElement1]} />
        <View style={[styles.patternElement, styles.patternElement2]} />
        <View style={[styles.patternElement, styles.patternElement3]} />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {renderPatternElements()}
      
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={IMAGES.safarsaathi}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Heading */}
        <Text style={styles.title}>Tell Us Your Age</Text>
        
        {/* Subheading */}
        <Text style={styles.subtitle}>
          This helps us match you with compatible companions.
        </Text>
        
        {/* Age Circle */}
        <View style={styles.ageCircleContainer}>
          <Animated.View 
            entering={FadeIn.duration(500)}
            style={styles.ageCircle}
          >
            <View style={styles.ageControls}>
              <TouchableOpacity 
                onPress={decreaseAge} 
                style={styles.ageControlButton}
                activeOpacity={0.9}
              >
                <Ionicons name="remove" size={20} color="#00CEC9" />
              </TouchableOpacity>
              <Animated.Text style={[styles.ageText, animatedAgeStyle]}>{age}</Animated.Text>
              <TouchableOpacity 
                onPress={increaseAge} 
                style={styles.ageControlButton}
                activeOpacity={0.9}
              >
                <Ionicons name="add" size={20} color="#00CEC9" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
        
        {/* Compliment Text */}
        {hasInteracted && (
          <Animated.Text style={[styles.complimentText, animatedComplimentStyle]}>
            {compliment}
          </Animated.Text>
        )}
        
        {/* Age Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderTrack} />
          <Animated.View style={[styles.sliderFill, animatedFillStyle]} />
          <Animated.View 
            style={[styles.sliderThumb, animatedThumbStyle]} 
            {...panResponder.panHandlers}
          />
          
          {/* Age Range Labels */}
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>{MIN_AGE}</Text>
            <Text style={styles.sliderLabelText}>{MAX_AGE}</Text>
          </View>
        </View>
        
        {/* Age Tooltip */}
        <View style={styles.tooltipContainer}>
          <Ionicons name="information-circle" size={20} color="#00CEC9" />
          <Text style={styles.tooltipText}>
            Share your true age for meaningful travel connections. Your privacy is always protected.
          </Text>
        </View>
        
        {/* Warning Message */}
        {error && (
          <View style={styles.warningContainer}>
            <Ionicons name="alert-circle" size={20} color="#FFF" />
            <Text style={styles.warningText}>
              You must be at least 18 years old to use SafarSaathi.
            </Text>
          </View>
        )}
        
        {/* Continue Button */}
        <Animated.View style={[styles.buttonWrapper, animatedButtonStyle]}>
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={handleContinue}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </Animated.View>
        
        {/* Page Indicators */}
        <View style={styles.pageIndicators}>
          <View style={[styles.indicator, styles.activeIndicator]} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
        </View>
        
        {/* Home Indicator */}
        <View style={styles.homeIndicator} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  patternContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  patternElement: {
    position: 'absolute',
    borderRadius: 100,
    opacity: 0.05,
  },
  patternElement1: {
    backgroundColor: '#00CEC9',
    width: 300,
    height: 300,
    top: -150,
    right: -100,
  },
  patternElement2: {
    backgroundColor: '#00CEC9',
    width: 200,
    height: 200,
    bottom: 100,
    left: -100,
  },
  patternElement3: {
    backgroundColor: '#FF7675',
    width: 150,
    height: 150,
    bottom: -50,
    right: -30,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
  },
  title: {
    fontSize: 28,
    fontFamily: "montserratBold",
    color: "#00CEC9", // Using teal color from the image
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "montserrat",
    color: "grey",
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  ageCircleContainer: {
    marginBottom: 16,
  },
  ageCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "#00CEC9", // Using teal color from the image
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: 'rgba(0, 206, 201, 0.05)',
  },
  ageControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
  },
  ageControlButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ageText: {
    fontSize: 42,
    fontFamily: "montserratBold",
    color: "#FF7675", // Using coral color for the age number
  },
  complimentText: {
    fontSize: 16,
    fontFamily: "montserratMedium",
    color: "#00CEC9",
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
    height: 20,
    marginBottom: 8,
    position: "relative",
  },
  sliderTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    position: "absolute",
    top: 7,
  },
  sliderFill: {
    height: 6,
    backgroundColor: "#00CEC9",
    borderRadius: 3,
    position: "absolute",
    top: 7,
    left: 0,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FF7675",
    position: "absolute",
    top: -2,
    // Add shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
  sliderLabelText: {
    fontSize: 12,
    fontFamily: 'montserrat',
    color: '#6B7280',
  },
  tooltipContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(0, 206, 201, 0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    marginTop: 16,
    width: "100%",
  },
  tooltipText: {
    fontSize: 14,
    fontFamily: "montserrat",
    color: "#374151",
    marginLeft: 8,
    flex: 1,
    lineHeight: 20,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#D58E9F", // Light pink background
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    width: "100%",
  },
  warningText: {
    fontSize: 14,
    fontFamily: "montserrat",
    color: "#FFFFFF",
    marginLeft: 8,
    flex: 1,
  },
  buttonWrapper: {
    width: "100%",
    marginTop: "auto",
    marginBottom: 24,
  },
  continueButton: {
    backgroundColor: "#00CEC9",
    width: "100%",
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    fontSize: 16,
    fontFamily: "montserratBold",
    color: "#FFFFFF",
  },
  pageIndicators: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#CBD5E1",
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: "#00CEC9",
    width: 16,
  },
  homeIndicator: {
    width: 36,
    height: 5,
    backgroundColor: "#000000",
    borderRadius: 2.5,
    opacity: 0.2,
  },
});

