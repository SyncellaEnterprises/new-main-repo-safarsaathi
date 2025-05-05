import * as React from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView,
  StyleSheet,
  StatusBar,
  Image,
  ActivityIndicator,
  Platform
} from "react-native";
import { useRouter } from "expo-router";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import IMAGES from "@/src/constants/images";

// Fix for TypeScript error with StatusBar.currentHeight
const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

const GENDER_OPTIONS = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' },
  { id: 'non-binary', label: 'Non-binary' },
  { id: 'prefer_not_to_say', label: 'Prefer not to say' }
];

export default function GenderScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateGender, isLoading } = useOnboarding();
  const [selectedGender, setSelectedGender] = React.useState<string | null>(null);

  const handleGenderSelect = (gender: string) => {
    setSelectedGender(gender);
  };

  const handleNext = async () => {
    if (!selectedGender) {
      toast.show("Please select your gender", "error");
      return;
    }

    try {
      const success = await updateGender(selectedGender);
      if (success) {
        router.push('/onboarding/occupation');
      } else {
        toast.show("Failed to save gender. Please try again.", "error");
      }
    } catch (error) {
      console.error('Gender update error:', error);
      toast.show("An error occurred. Please try again.", "error");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.contentContainer}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={IMAGES.safarsaathi}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Your Gender</Text>
        </View>
        
        {/* Gender Options */}
        <View style={styles.optionsContainer}>
          {GENDER_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.genderOption,
                selectedGender === option.id && styles.selectedOption
              ]}
              onPress={() => handleGenderSelect(option.id)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.genderOptionText,
                selectedGender === option.id && styles.selectedOptionText
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Information Text */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#6B7280" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            This information helps us personalize your experience.
          </Text>
        </View>
        
        {/* Next Button */}
        <TouchableOpacity 
          style={[
            styles.nextButton,
            !selectedGender && styles.disabledButton
          ]}
          onPress={handleNext}
          disabled={!selectedGender || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.nextButtonText}>Next</Text>
          )}
        </TouchableOpacity>
        
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 56,
    marginTop: 40,
  },
  logo: {
    width: 160,
    height: 60,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'montserratBold',
    color: '#111827',
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  genderOption: {
    width: '100%',
    height: 56,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  selectedOption: {
    borderColor: '#00CEC9',
    backgroundColor: '#F0FDFD',
  },
  genderOptionText: {
    fontSize: 16,
    fontFamily: 'montserrat',
    color: '#111827',
  },
  selectedOptionText: {
    fontFamily: 'montserratBold',
    color: '#00CEC9',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  infoIcon: {
    marginRight: 8,
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'montserrat',
    color: '#6B7280',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#00CEC9',
    width: '100%',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
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
  },
});
