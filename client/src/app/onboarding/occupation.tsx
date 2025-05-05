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
  TextInput
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
}

const OCCUPATIONS: Occupation[] = [
  { id: 'tech_dev', label: 'Tech / Developer', icon: 'code-slash-outline' },
  { id: 'student_learner', label: 'Student / Learner', icon: 'school-outline' },
  { id: 'traveler_explorer', label: 'Traveler / Explorer', icon: 'airplane-outline' },
  { id: 'creative_designer', label: 'Creative / Designer', icon: 'color-palette-outline' },
  { id: 'corporate_professional', label: 'Corporate / Professional', icon: 'briefcase-outline' },
  { id: 'freelancer', label: 'Freelancer', icon: 'desktop-outline' }
];

export default function OccupationScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateOccupation, isLoading } = useOnboarding();
  const [selectedOccupations, setSelectedOccupations] = React.useState<string[]>([]);
  const [customOccupation, setCustomOccupation] = React.useState<string>('');
  const [showError, setShowError] = React.useState<boolean>(false);

  const toggleOccupation = (id: string) => {
    setShowError(false);
    if (selectedOccupations.includes(id)) {
      setSelectedOccupations(selectedOccupations.filter(item => item !== id));
    } else {
      setSelectedOccupations([...selectedOccupations, id]);
    }
  };

  const handleContinue = async () => {
    // Check if any occupation is selected or custom occupation is provided
    if (selectedOccupations.length === 0 && !customOccupation.trim()) {
      setShowError(true);
      return;
    }

    try {
      // Format occupations - combine selected with custom
      let occupationData = selectedOccupations;
      if (customOccupation.trim()) {
        occupationData = [...occupationData, `custom:${customOccupation.trim()}`];
      }
      
      const success = await updateOccupation(occupationData.join(','));
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
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
        
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
          <Text style={styles.infoText}>
            Sharing your job helps people connect over common interests
          </Text>
        </View>
        
        <View style={styles.occupationsGrid}>
          {OCCUPATIONS.map((occupation) => (
            <TouchableOpacity
              key={occupation.id}
              style={[
                styles.occupationButton,
                selectedOccupations.includes(occupation.id) && styles.selectedButton
              ]}
              onPress={() => toggleOccupation(occupation.id)}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={occupation.icon as any} 
                size={20} 
                color={selectedOccupations.includes(occupation.id) ? "#00CEC9" : "#374151"} 
                style={styles.occupationIcon}
              />
              <Text style={[
                styles.occupationText,
                selectedOccupations.includes(occupation.id) && styles.selectedText
              ]}>
                {occupation.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <TouchableOpacity 
          style={styles.customOccupationButton}
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={20} color="#374151" style={styles.customIcon} />
          <TextInput
            style={styles.customInput}
            placeholder="Don't see your role? Add your own"
            placeholderTextColor="#6B7280"
            value={customOccupation}
            onChangeText={(text) => {
              setCustomOccupation(text);
              setShowError(false);
            }}
          />
        </TouchableOpacity>
        
        {showError && (
          <Text style={styles.errorText}>
            Please select or enter at least one occupation to continue
          </Text>
        )}
        
        <TouchableOpacity
          style={[
            styles.continueButton,
            (selectedOccupations.length === 0 && !customOccupation.trim()) && styles.disabledButton
          ]}
          onPress={handleContinue}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </TouchableOpacity>
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
  header: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 12,
  },
  logo: {
    width: 120,
    height: 30,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 28,
    fontFamily: 'montserratBold',
    color: '#111827',
    marginTop: 16,
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  infoText: {
    fontFamily: 'montserrat',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
  occupationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  occupationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    width: '48%',
  },
  selectedButton: {
    borderColor: '#00CEC9',
    backgroundColor: '#F0FDFD',
  },
  occupationIcon: {
    marginRight: 8,
  },
  occupationText: {
    fontFamily: 'montserrat',
    fontSize: 14,
    color: '#374151',
  },
  selectedText: {
    color: '#00CEC9',
    fontFamily: 'montserratBold',
  },
  customOccupationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    width: '100%',
  },
  customIcon: {
    marginRight: 8,
  },
  customInput: {
    flex: 1,
    fontFamily: 'montserrat',
    fontSize: 14,
    color: '#374151',
    padding: 0,
  },
  errorText: {
    fontFamily: 'montserrat',
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 16,
  },
  continueButton: {
    backgroundColor: '#00CEC9',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  continueButtonText: {
    fontFamily: 'montserratBold',
    fontSize: 16,
    color: '#FFFFFF',
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
