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
  Platform,
  Animated
} from "react-native";
import { useRouter } from "expo-router";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import IMAGES from "@/src/constants/images";

// Fix for TypeScript error with StatusBar.currentHeight
const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

const GENDER_OPTIONS = [
  { id: 'male', label: 'Male', icon: 'male' },
  { id: 'female', label: 'Female', icon: 'female' },
  { id: 'non-binary', label: 'Non-binary', icon: 'male-female' }
];

export default function GenderScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateGender, isLoading } = useOnboarding();
  const [selectedGender, setSelectedGender] = React.useState<string | null>(null);
  
  // Animation values for selection effect
  const animationValues = React.useRef(GENDER_OPTIONS.map(() => new Animated.Value(0))).current;

  const handleGenderSelect = (gender: string, index: number) => {
    setSelectedGender(gender);
    
    // Reset all animations
    animationValues.forEach((anim, i) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false
      }).start();
    });
    
    // Animate the selected option
    Animated.timing(animationValues[index], {
      toValue: 1,
      duration: 300,
      useNativeDriver: false
    }).start();
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
          <Text style={styles.subtitle}>
            This helps us personalize your experience
          </Text>
        </View>
        
        {/* Gender Options */}
        <View style={styles.optionsContainer}>
          {GENDER_OPTIONS.map((option, index) => {
            // Create dynamic styles based on animation values
            const backgroundColor = animationValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(255, 255, 255, 1)', 'rgba(240, 253, 253, 1)']
            });
            
            const scale = animationValues[index].interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 1.03, 1]
            });
            
            const borderColor = animationValues[index].interpolate({
              inputRange: [0, 1],
              outputRange: ['rgba(229, 231, 235, 1)', 'rgba(0, 206, 201, 1)']
            });
            
            return (
              <TouchableOpacity
                key={option.id}
                activeOpacity={0.7}
                onPress={() => handleGenderSelect(option.id, index)}
              >
                <Animated.View
                  style={[
                    styles.genderOption,
                    { 
                      backgroundColor,
                      borderColor,
                      transform: [{ scale }]
                    }
                  ]}
                >
                  <View style={styles.genderIconContainer}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={24} 
                      color={selectedGender === option.id ? "#00CEC9" : "#6B7280"} 
                    />
                  </View>
                  <Text 
                    style={[
                      styles.genderOptionText,
                      selectedGender === option.id && styles.selectedOptionText
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedGender === option.id && (
                    <View style={styles.checkIconContainer}>
                      <Ionicons name="checkmark-circle" size={24} color="#00CEC9" />
                    </View>
                  )}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
        
        {/* Information Text */}
        <View style={styles.infoContainer}>
          <View style={styles.tooltipContainer}>
            <Ionicons name="information-circle" size={22} color="#00CEC9" />
            <Text style={styles.tooltipText}>
              We use this information to help you find compatible travel partners.
              We respect your privacy and identity.
            </Text>
          </View>
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
        
        {/* Page Indicators */}
        <View style={styles.pageIndicators}>
          <View style={styles.indicator} />
          <View style={styles.indicator} />
          <View style={[styles.indicator, styles.activeIndicator]} />
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
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logo: {
    width: 100,
    height: 100,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'montserratBold',
    textAlign: 'center',
    fontWeight: 'bold',
    color: '#00CEC9',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'montserrat',
    color: 'grey',
    textAlign: 'center',
  },
  optionsContainer: {
    width: '100%',
    marginBottom: 40,
  },
  genderOption: {
    width: '100%',
    height: 70,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  genderIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  genderOptionText: {
    fontSize: 18,
    fontFamily: 'montserrat',
    color: '#111827',
    flex: 1,
  },
  selectedOptionText: {
    fontFamily: 'montserratBold',
    color: '#00CEC9',
  },
  checkIconContainer: {
    width: 24,
    height: 24,
  },
  infoContainer: {
    width: '100%',
    marginTop: 'auto',
    marginBottom: 24,
  },
  tooltipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    borderRadius: 12,
  },
  tooltipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'montserrat',
    color: '#374151',
    lineHeight: 20,
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
    shadowOpacity: 0,
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
  },
});
