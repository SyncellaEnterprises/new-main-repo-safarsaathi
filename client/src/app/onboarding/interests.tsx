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
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import IMAGES from "@/src/constants/images";

// Fix for TypeScript error with StatusBar.currentHeight
const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

// Define interest categories
const INTEREST_CATEGORIES = [
  {
    id: 'outdoor',
    name: 'Outdoor Activities',
    icon: 'leaf-outline',
    interests: [
      'Hiking', 'Camping', 'Beach', 'Cycling', 'Rock Climbing', 'Fishing'
    ]
  },
  {
    id: 'culture',
    name: 'Culture & Arts',
    icon: 'color-palette-outline',
    interests: [
      'Museums', 'Theater', 'Photography', 'Music', 'Dance', 'Art'
    ]
  },
  {
    id: 'food',
    name: 'Food & Dining',
    icon: 'restaurant-outline',
    interests: [
      'Local Food', 'Cooking', 'Wine Tasting', 'Cafes', 'Street Food'
    ]
  },
  {
    id: 'travel',
    name: 'Travel Style',
    icon: 'airplane-outline',
    interests: [
      'Adventure', 'Backpacking', 'Luxury', 'Road Trips', 'Solo Travel'
    ]
  },
  {
    id: 'social',
    name: 'Social Activities',
    icon: 'people-outline',
    interests: [
      'Board Games', 'Karaoke', 'Dancing', 'Sports', 'Volunteering'
    ]
  }
];

export default function InterestsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateInterests, isLoading } = useOnboarding();
  const [selectedInterests, setSelectedInterests] = React.useState<string[]>([]);
  const [showError, setShowError] = React.useState<boolean>(false);
  
  const MIN_INTERESTS = 3;
  const MAX_INTERESTS = 8;

  const handleSelectInterest = (interest: string) => {
    setShowError(false);
    
    if (selectedInterests.includes(interest)) {
      // Remove interest if already selected
      setSelectedInterests(selectedInterests.filter(item => item !== interest));
    } else {
      // Add interest if under the limit
      if (selectedInterests.length >= MAX_INTERESTS) {
        toast.show(`You can only select up to ${MAX_INTERESTS} interests`, "error");
        return;
      }
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleDone = async () => {
    if (selectedInterests.length < MIN_INTERESTS) {
      setShowError(true);
      return;
    }

    try {
      const success = await updateInterests(selectedInterests);
      if (success) {
        router.push('/onboarding/prompts');
      } else {
        toast.show("Failed to save interests. Please try again.", "error");
      }
    } catch (error) {
      console.error('Interest update error:', error);
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
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>What Are You Into?</Text>
        <Text style={styles.subtitle}>Choose at least {MIN_INTERESTS}, max {MAX_INTERESTS}.</Text>
        
        {/* Interest Categories */}
        {INTEREST_CATEGORIES.map((category) => (
          <View key={category.id} style={styles.categoryContainer}>
            <View style={styles.categoryHeader}>
              <Ionicons name={category.icon as any} size={22} color="#00CEC9" />
              <Text style={styles.categoryTitle}>{category.name}</Text>
            </View>
            
            <View style={styles.interestsGrid}>
              {category.interests.map((interest) => (
                <TouchableOpacity
                  key={interest}
                  style={[
                    styles.interestButton,
                    selectedInterests.includes(interest) && styles.selectedInterestButton
                  ]}
                  onPress={() => handleSelectInterest(interest)}
                  activeOpacity={0.9}
                >
                  <Text style={[
                    styles.interestText,
                    selectedInterests.includes(interest) && styles.selectedInterestText
                  ]}>
                    {interest}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
        
        {/* Tooltip */}
        <View style={styles.tooltipContainer}>
          <Ionicons name="information-circle" size={22} color="#00CEC9" />
          <Text style={styles.tooltipText}>
            Your interests help us connect you with like-minded travel enthusiasts and suggest relevant activities.
          </Text>
        </View>
        
        {showError && (
          <Text style={styles.errorText}>
            Select between {MIN_INTERESTS} to {MAX_INTERESTS} interests to continue.
          </Text>
        )}
        
        {/* Page Indicators */}
        <View style={styles.pageIndicators}>
          <View style={styles.indicator} />
          <View style={[styles.indicator, styles.activeIndicator]} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
        </View>
        
        <TouchableOpacity
          style={[
            styles.doneButton,
            selectedInterests.length < MIN_INTERESTS && styles.disabledButton
          ]}
          onPress={handleDone}
          activeOpacity={0.9}
          disabled={selectedInterests.length < MIN_INTERESTS || isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.doneButtonText}>Continue</Text>
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
    paddingTop: 20,
    paddingBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontFamily: 'montserratBold',
    fontWeight: 'bold',
    color: '#00CEC9',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'montserrat',
    color: 'grey',
    marginBottom: 32,
    textAlign: 'center',
  },
  categoryContainer: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontFamily: 'montserratBold',
    color: '#111827',
    marginLeft: 10,
  },
  interestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: -6,  // Compensate for gap
  },
  interestButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 50,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginLeft: 6,
    marginBottom: 12,
  },
  selectedInterestButton: {
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    borderColor: '#00CEC9',
  },
  interestText: {
    fontSize: 14,
    fontFamily: 'montserrat',
    color: '#374151',
  },
  selectedInterestText: {
    color: '#00CEC9',
    fontFamily: 'montserratBold',
  },
  tooltipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
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
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 24,
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
  errorText: {
    fontSize: 14,
    fontFamily: 'montserrat',
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 24,
  },
  doneButton: {
    backgroundColor: '#00CEC9',
    borderRadius: 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  doneButtonText: {
    fontSize: 16,
    fontFamily: 'montserratBold',
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
  },
});