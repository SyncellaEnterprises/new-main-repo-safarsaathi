import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet, 
  StatusBar, 
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated
} from "react-native";
import { useRouter } from "expo-router";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import IMAGES from "@/src/constants/images";

export default function BioScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateBio, isLoading } = useOnboarding();
  const [bio, setBio] = useState("");
  const maxCharCount = 150;
  const minCharCount = 30;
  const progressAnim = new Animated.Value(0);

  // Update progress bar based on character count
  useEffect(() => {
    const progress = Math.min(bio.length / minCharCount, 1);
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [bio]);

  const handleNext = async () => {
    if (bio.trim().length < minCharCount) {
      toast.show(`Please add at least ${minCharCount} characters to your bio`, "error");
      return;
    }

    try {
      const success = await updateBio(bio.trim());
      if (success) {
        router.push('/onboarding/gender');
      } else {
        toast.show("Failed to save bio. Please try again.", "error");
      }
    } catch (error) {
      console.error('Bio update error:', error);
      toast.show("An error occurred. Please try again.", "error");
    }
  };

  // Calculate progress bar color
  const getProgressColor = () => {
    if (bio.length < minCharCount * 0.3) return '#FF7675'; // Red for < 30%
    if (bio.length < minCharCount) return '#FFB84C'; // Yellow for 30-100%
    return '#4ECDC4'; // Green for >= 100%
  };

  const progressBarColor = getProgressColor();
  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%']
  });

  const getButtonOpacity = () => {
    return bio.length >= minCharCount ? 1 : 0.6;
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
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Image 
              source={IMAGES.safarsaathi}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Main Content */}
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Tell Us About You</Text>
            <Text style={styles.subtitle}>
              Share a brief bio to let others know more about you.
            </Text>
            
            {/* Text Input */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Highlight your interests and what you're looking for in a travel companion."
                placeholderTextColor="#A1A1AA"
                multiline
                textAlignVertical="top"
                value={bio}
                onChangeText={setBio}
                maxLength={maxCharCount}
              />
              
              {/* Character Progress Bar */}
              <View style={styles.charProgressContainer}>
                <Animated.View 
                  style={[
                    styles.charProgressBar, 
                    { 
                      width: progressBarWidth,
                      backgroundColor: progressBarColor 
                    }
                  ]} 
                />
              </View>
              
              {/* Character Count */}
              <View style={styles.charCountContainer}>
                <Text style={styles.charCountInfo}>
                  {bio.length < minCharCount ? 
                    `${minCharCount - bio.length} more characters needed` : 
                    `${maxCharCount - bio.length} characters remaining`
                  }
                </Text>
                <Text style={styles.charCount}>{bio.length}/{maxCharCount}</Text>
              </View>
            </View>

            {/* Tip Box */}
            <View style={styles.tipContainer}>
              <Ionicons name="information-circle" size={22} color="#00CEC9" />
              <Text style={styles.tipText}>
                A good bio should include your interests, travel preferences, and what you're looking for in a travel partner.
              </Text>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              style={[
                styles.nextButton,
                { opacity: getButtonOpacity() }
              ]}
              onPress={handleNext}
              disabled={isLoading || bio.length < minCharCount}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
            
            {/* Page Indicators */}
            <View style={styles.pageIndicators}>
              <View style={styles.indicator} />
              <View style={[styles.indicator, styles.activeIndicator]} />
              <View style={styles.indicator} />
              <View style={styles.indicator} />
            </View>
            
            {/* Home Indicator */}
            <View style={styles.homeIndicator} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 36,
    marginTop: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'montserratBold',
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#00CEC9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'montserrat',
    color: 'grey',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 48,
    marginBottom: 24,
    position: 'relative',
  },
  input: {
    minHeight: 120,
    fontFamily: 'montserrat',
    fontSize: 16,
    color: '#111827',
    paddingTop: 0,
    paddingBottom: 0,
    textAlignVertical: 'top',
  },
  charProgressContainer: {
    position: 'absolute',
    bottom: 32,
    left: 16,
    right: 16,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  charProgressBar: {
    height: '100%',
    borderRadius: 2,
  },
  charCountContainer: {
    position: 'absolute',
    bottom: 8,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCountInfo: {
    fontSize: 12,
    fontFamily: 'montserrat',
    color: '#6B7280',
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'montserrat',
    color: '#9CA3AF',
  },
  tipContainer: {
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'montserrat',
    color: '#374151',
    lineHeight: 20,
  },
  nextButton: {
    backgroundColor: '#00CEC9',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'montserratBold',
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: '#00CEC9',
    width: 16,
  },
  homeIndicator: {
    width: 36,
    height: 5,
    backgroundColor: '#000000',
    borderRadius: 2.5,
    opacity: 0.2,
    alignSelf: 'center',
    marginTop: 8,
  },
});
