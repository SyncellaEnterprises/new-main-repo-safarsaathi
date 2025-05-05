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
  ScrollView,
  TextInput,
  Animated
} from "react-native";
import { useRouter } from "expo-router";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import IMAGES from "@/src/constants/images";

// Fix for TypeScript error with StatusBar.currentHeight
const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

interface Occupation {
  id: string;
  label: string;
  icon: string;
  color: string;
}

const OCCUPATIONS: Occupation[] = [
  { id: 'tech_dev', label: 'Tech / Developer', icon: 'code-slash-outline', color: '#FF6B6B' },
  { id: 'student_learner', label: 'Student / Learner', icon: 'school-outline', color: '#4ECDC4' },
  { id: 'traveler_explorer', label: 'Traveler / Explorer', icon: 'airplane-outline', color: '#FFB84C' },
  { id: 'creative_designer', label: 'Creative / Designer', icon: 'color-palette-outline', color: '#FF8FB1' },
  { id: 'corporate_professional', label: 'Corporate / Professional', icon: 'briefcase-outline', color: '#45B7D1' },
  { id: 'freelancer', label: 'Freelancer', icon: 'desktop-outline', color: '#4ECDC4' }
];

export default function OccupationScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateOccupation, isLoading } = useOnboarding();
  const [selectedOccupation, setSelectedOccupation] = React.useState<string | null>(null);
  const [customOccupation, setCustomOccupation] = React.useState<string>('');
  const [showError, setShowError] = React.useState<boolean>(false);
  
  // Animation values for button presses
  const buttonAnimations = React.useRef(
    OCCUPATIONS.map(() => new Animated.Value(0))
  ).current;

  const handleSelectOccupation = (id: string, index: number) => {
    setShowError(false);
    setSelectedOccupation(id);
    
    // Reset all animations
    buttonAnimations.forEach((anim) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false
      }).start();
    });
    
    // Animate the selected button
    Animated.timing(buttonAnimations[index], {
      toValue: 1,
      duration: 300,
      useNativeDriver: false
    }).start();
    
    // Clear custom occupation when a predefined one is selected
    setCustomOccupation('');
  };
  
  const handleSelectCustom = () => {
    // Clear standard occupation selection when custom is being used
    setSelectedOccupation(null);
    
    // Reset all animations
    buttonAnimations.forEach((anim) => {
      Animated.timing(anim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: false
      }).start();
    });
  };

  const handleContinue = async () => {
    // Check if any occupation is selected or custom occupation is provided
    if (!selectedOccupation && !customOccupation.trim()) {
      setShowError(true);
      return;
    }

    try {
      // Format occupation data
      let occupationData = "";
      if (selectedOccupation) {
        occupationData = selectedOccupation;
      } else if (customOccupation.trim()) {
        occupationData = `custom:${customOccupation.trim()}`;
      }
      
      const success = await updateOccupation(occupationData);
      if (success) {
        router.push('/onboarding/location');
      } else {
        toast.show("Failed to save occupation. Please try again.", "error");
      }
    } catch (error) {
      console.error('Occupation update error:', error);
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
      
      <View style={styles.header}>
        <Image 
          source={IMAGES.safarsaathi}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>What's your occupation?</Text>
        
        <Text style={styles.subtitle}>
          Let us know what you do for work or study
        </Text>
        
        <View style={styles.occupationsGrid}>
          {OCCUPATIONS.map((occupation, index) => {
            // Create animated styles
            const backgroundColor = buttonAnimations[index].interpolate({
              inputRange: [0, 1],
              outputRange: ['#FFFFFF', `${occupation.color}10`] // 10% opacity version of the color
            });
            
            const borderColor = buttonAnimations[index].interpolate({
              inputRange: [0, 1],
              outputRange: ['#E5E7EB', occupation.color]
            });
            
            const scale = buttonAnimations[index].interpolate({
              inputRange: [0, 0.5, 1],
              outputRange: [1, 1.05, 1]
            });
            
            return (
              <TouchableOpacity
                key={occupation.id}
                onPress={() => handleSelectOccupation(occupation.id, index)}
                activeOpacity={0.9}
                style={styles.occupationTouchable}
              >
                <Animated.View
                  style={[
                    styles.occupationButton,
                    { 
                      backgroundColor,
                      borderColor,
                      transform: [{ scale }]
                    }
                  ]}
                >
                  <View 
                    style={[
                      styles.iconCircle,
                      { backgroundColor: `${occupation.color}20` } // 20% opacity
                    ]}
                  >
                    <Ionicons 
                      name={occupation.icon as any} 
                      size={20} 
                      color={occupation.color}
                    />
                  </View>
                  <Text style={[
                    styles.occupationText,
                    selectedOccupation === occupation.id && { color: occupation.color, fontFamily: 'montserratBold' }
                  ]}>
                    {occupation.label}
                  </Text>
                  {selectedOccupation === occupation.id && (
                    <Ionicons name="checkmark-circle" size={20} color={occupation.color} style={styles.checkIcon} />
                  )}
                </Animated.View>
              </TouchableOpacity>
            );
          })}
        </View>
        
        <View style={styles.dividerContainer}>
          <View style={styles.divider} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.divider} />
        </View>
        
        <TouchableOpacity 
          style={[
            styles.customOccupationButton,
            customOccupation.trim() !== '' && styles.activeCustomButton
          ]}
          activeOpacity={0.9}
          onPress={() => handleSelectCustom()}
        >
          <View style={styles.customIconContainer}>
            <Ionicons name="add-circle" size={22} color="#00CEC9" />
          </View>
          <TextInput
            style={styles.customInput}
            placeholder="Add your own occupation"
            placeholderTextColor="#6B7280"
            value={customOccupation}
            onChangeText={(text) => {
              setCustomOccupation(text);
              if (text.trim() !== '') {
                handleSelectCustom();
              }
              setShowError(false);
            }}
          />
        </TouchableOpacity>
        
        {/* Tooltip */}
        <View style={styles.tooltipContainer}>
          <Ionicons name="information-circle" size={22} color="#00CEC9" />
          <Text style={styles.tooltipText}>
            Your occupation helps match you with travelers who share similar interests and backgrounds.
          </Text>
        </View>
        
        {showError && (
          <Text style={styles.errorText}>
            Please select or enter an occupation to continue
          </Text>
        )}
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            (!selectedOccupation && !customOccupation.trim()) && styles.disabledButton
          ]}
          onPress={handleContinue}
          activeOpacity={0.9}
          disabled={isLoading || (!selectedOccupation && !customOccupation.trim())}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
        
        {/* Page Indicators */}
        <View style={styles.pageIndicators}>
          <View style={styles.indicator} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
          <View style={[styles.indicator, styles.activeIndicator]} />
        </View>
      </ScrollView>
      
      <View style={styles.homeIndicator} />
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
  header: {
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'montserratBold',
    fontWeight: 'bold',
    color: '#00CEC9',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'montserrat',
    color: 'grey',
    textAlign: 'center',
    marginBottom: 24,
  },
  occupationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  occupationTouchable: {
    width: '48%',
    marginBottom: 16,
  },
  occupationButton: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  occupationText: {
    fontFamily: 'montserrat',
    fontSize: 14,
    color: '#374151',
    marginRight: 20, // Space for check icon
  },
  checkIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    paddingHorizontal: 16,
    color: '#6B7280',
    fontFamily: 'montserrat',
  },
  customOccupationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  activeCustomButton: {
    borderColor: '#00CEC9',
    backgroundColor: 'rgba(0, 206, 201, 0.05)',
  },
  customIconContainer: {
    marginRight: 12,
  },
  customInput: {
    flex: 1,
    fontFamily: 'montserrat',
    fontSize: 15,
    color: '#374151',
    padding: 0,
  },
  tooltipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tooltipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    fontFamily: 'montserrat',
    color: '#374151',
    lineHeight: 20,
  },
  errorText: {
    fontFamily: 'montserrat',
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
  continueButton: {
    backgroundColor: '#00CEC9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  continueButtonText: {
    fontFamily: 'montserratBold',
    fontSize: 16,
    color: '#FFFFFF',
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
    marginBottom: 8,
  }
});
