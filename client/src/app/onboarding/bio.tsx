import React, { useState } from "react";
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
  ScrollView
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

  const handleNext = async () => {
    if (bio.trim().length < 5) {
      toast.show("Please provide a more detailed bio", "error");
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoid}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Progress Indicators */}
          <View style={styles.progressContainer}>
            <View style={styles.progressDot} />
            <View style={[styles.progressDot, styles.activeDot]} />
            <View style={styles.progressDot} />
          </View>

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
            <Text style={styles.title}>About You</Text>
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
              <Text style={styles.charCount}>{bio.length}/{maxCharCount}</Text>
            </View>

            {/* Tip Box */}
            <View style={styles.tipContainer}>
              <Ionicons name="information-circle" size={22} color="#00CEC9" />
              <Text style={styles.tipText}>
                Highlight your interests and what you're looking for in a travel companion.
              </Text>
            </View>

            {/* Next Button */}
            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>

          {/* Home Indicator */}
          <View style={styles.homeIndicator} />
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#00CEC9',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 56,
  },
  logo: {
    width: 60,
    height: 60,
    tintColor: '#00CEC9',
  },
  contentContainer: {
    flex: 1,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'montserratBold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'montserrat',
    color: '#6B7280',
    marginBottom: 24,
  },
  inputContainer: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
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
  charCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
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
  },
  nextButton: {
    backgroundColor: '#00CEC9',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'montserratBold',
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
