import { View, Text, TouchableOpacity, SafeAreaView, StyleSheet, StatusBar, Image, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import IMAGES from "@/src/constants/images";

const { width } = Dimensions.get("window");

export default function AgeScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateAge, isLoading } = useOnboarding();
  const [age, setAge] = useState(25);
  const [error, setError] = useState(false);

  const handleAgeChange = (newAge: number) => {
    if (newAge < 18) {
      setError(true);
      return;
    }
    
    if (newAge > 100) {
      return;
    }
    
    setError(false);
    setAge(newAge);
  };

  const handleContinue = async () => {
    if (age < 18) {
      setError(true);
      toast.show("You must be at least 18 years old to use SafarSaathi.", "error");
      return;
    }

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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
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
            <Text style={styles.ageText}>{age}</Text>
          </Animated.View>
        </View>
        
        {/* Age Slider */}
        <View style={styles.sliderContainer}>
          <View style={styles.sliderTrack} />
          <View style={[styles.sliderFill, { width: `${(age - 18) / (100 - 18) * 100}%` }]} />
          <TouchableOpacity 
            style={styles.sliderThumb}
            onPress={() => {}}
          />
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
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
          disabled={isLoading}
        >
          <Text style={styles.continueText}>Continue</Text>
        </TouchableOpacity>
        
        {/* Page Indicators */}
        <View style={styles.pageIndicators}>
          <View style={[styles.indicator, styles.activeIndicator]} />
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
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 28,
    fontFamily: "montserratBold",
    color: "#00CEC9", // Using teal color from the image
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "montserrat",
    color: "#64748B",
    textAlign: "center",
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  ageCircleContainer: {
    marginBottom: 40,
  },
  ageCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 2,
    borderColor: "#00CEC9", // Using teal color from the image
    alignItems: "center",
    justifyContent: "center",
  },
  ageText: {
    fontSize: 40,
    fontFamily: "montserratBold",
    color: "#FF7675", // Using coral color for the age number
  },
  sliderContainer: {
    width: width - 48,
    height: 20,
    marginBottom: 40,
    position: "relative",
  },
  sliderTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    position: "absolute",
    top: 8,
  },
  sliderFill: {
    height: 4,
    backgroundColor: "#00CEC9",
    borderRadius: 2,
    position: "absolute",
    top: 8,
    left: 0,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#FF7675",
    position: "absolute",
    top: 0,
    left: 0,
    // Add shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
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
  continueButton: {
    backgroundColor: "#00CEC9",
    width: "100%",
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: "auto",
    marginBottom: 24,
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
