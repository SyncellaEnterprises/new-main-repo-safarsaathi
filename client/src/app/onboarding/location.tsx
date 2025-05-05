import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Image, Platform, SafeAreaView, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  SlideInRight,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  FadeIn,
  ZoomIn,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolation
} from "react-native-reanimated";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons, MaterialIcons, Feather } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import IMAGES from "@/src/constants/images";

const { width, height } = Dimensions.get('window');
const ITEM_HEIGHT = 70;

type LocationDataType = {
  [state: string]: string[];
};

// Hardcoded states and cities data
const LOCATION_DATA: LocationDataType = {
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Kurnool", "Kakinada", "Tirupati", "Rajahmundry", "Kadapa", "Anantapur"
  ],
  "Assam": [
    "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Karimganj", "Diphu", "Goalpara"
  ],
  "Bihar": [
    "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Arrah", "Bihar Sharif", "Begusarai", "Katihar"
  ],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Gandhinagar", "Junagadh", "Anand", "Navsari"
  ],
  "Karnataka": [
    "Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi", "Kalaburagi", "Ballari", "Vijayapura", "Shivamogga", "Tumakuru"
  ],
  "Kerala": [
    "Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Kannur", "Kottayam", "Malappuram"
  ],
  "Madhya Pradesh": [
    "Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Dewas", "Satna", "Ratlam", "Rewa"
  ],
  "Maharashtra": [
    "Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati", "Navi Mumbai"
  ],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Batala", "Moga"
  ],
  "Rajasthan": [
    "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Sikar", "Sri Ganganagar"
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Vellore", "Erode", "Thoothukkudi"
  ],
  "Telangana": [
    "Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Secunderabad", "Nalgonda", "Suryapet", "Adilabad"
  ],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj", "Meerut", "Bareilly", "Aligarh", "Moradabad", "Saharanpur"
  ],
  "West Bengal": [
    "Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur"
  ]
};

type FilteredLocationsType = {
  type: 'states' | 'cities';
  data: string[];
};

// Fix for TypeScript error with StatusBar.currentHeight
const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

// Mock data for dropdown options
const STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", 
  "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", 
  "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", 
  "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", 
  "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", 
  "New Hampshire", "New Jersey", "New Mexico", "New York", 
  "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", 
  "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", 
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", 
  "West Virginia", "Wisconsin", "Wyoming"
];

const CITIES = {
  "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose"],
  "New York": ["New York City", "Buffalo", "Rochester", "Syracuse"],
  "Texas": ["Houston", "Austin", "Dallas", "San Antonio"],
  // Add more states and their cities as needed
};

export default function LocationScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateLocation, isLoading } = useOnboarding();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isSkeletonVisible, setIsSkeletonVisible] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState<boolean>(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const scale = useSharedValue(1);
  const scrollY = useSharedValue(0);
  const animatedOpacity = useSharedValue(0);
  
  // Animated styles
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

  const bgStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: interpolate(
            scrollY.value,
            [0, 100],
            [0, -20],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const buttonScale = useAnimatedStyle(() => {
    return {
      transform: [{ scale: withSpring(selectedState && selectedCity ? 1 : 0.95) }],
    };
  });

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSkeletonVisible(false);
      animatedOpacity.value = withSpring(1);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      setIsLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Permission to access location was denied', 'error');
        setIsLocationLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addressResult) {
        const formattedAddress = `${addressResult.city || ''}, ${addressResult.region || ''}`.trim();
        setAddress(formattedAddress);
        
        // Try to find matching state and city
        const state = Object.keys(LOCATION_DATA).find(state => 
          addressResult.region && state.toLowerCase().includes(addressResult.region.toLowerCase())
        );
        
        if (state) {
          setSelectedState(state);
          const city = LOCATION_DATA[state].find(city => 
            addressResult.city && city.toLowerCase().includes(addressResult.city.toLowerCase())
          );
          if (city) {
            setSelectedCity(city);
          }
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      toast.show('Error getting location', 'error');
    } finally {
      setIsLocationLoading(false);
    }
  };

  const getFilteredLocations = (): FilteredLocationsType => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      return selectedState 
        ? { type: 'cities', data: LOCATION_DATA[selectedState] }
        : { type: 'states', data: Object.keys(LOCATION_DATA) };
    }

    if (selectedState) {
      // Search in cities of selected state
      const cities = LOCATION_DATA[selectedState];
      const exactMatches = cities.filter((city: string) => 
        city.toLowerCase().startsWith(query)
      );
      const partialMatches = cities.filter((city: string) => 
        city.toLowerCase().includes(query) && !city.toLowerCase().startsWith(query)
      );
      return { type: 'cities', data: [...exactMatches, ...partialMatches] };
    } else {
      // Search in states
      const states = Object.keys(LOCATION_DATA);
      const exactMatches = states.filter(state => 
        state.toLowerCase().startsWith(query)
      );
      const partialMatches = states.filter(state => 
        state.toLowerCase().includes(query) && !state.toLowerCase().startsWith(query)
      );
      return { type: 'states', data: [...exactMatches, ...partialMatches] };
    }
  };

  const handleSelect = (item: string) => {
    setSubmitError(null);
    scale.value = withSpring(1.05, {}, () => {
      scale.value = withSpring(1);
    });
    
    if (selectedState) {
      setSelectedCity(item);
    } else {
      setSelectedState(item);
      setSearchQuery('');
    }
  };

  const handleBack = () => {
    setSelectedState(null);
    setSelectedCity(null);
    setSearchQuery('');
  };

  const handleNext = async () => {
    if (!selectedState || !selectedCity) {
      setSubmitError("Please select your location");
      toast.show("Please select your location", "error");
      return;
    }

    try {
      setSubmitError(null);
      const locationData = {
        state: selectedState,
        city: selectedCity,
        ...(location && {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }),
        address
      };

      const success = await updateLocation(JSON.stringify(locationData));
      if (success) {
        router.push('/onboarding/interests');
      } else {
        setSubmitError("Failed to save location");
        toast.show("Failed to save location. Please try again.", "error");
      }
    } catch (error) {
      console.error('Location update error:', error);
      setSubmitError("An error occurred");
      toast.show("An error occurred. Please try again.", "error");
    }
  };

  // Render skeleton loaders for location items
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <Animated.View
        key={`skeleton-${index}`}
        entering={FadeIn.delay(index * 100)}
        className="bg-neutral-dark/50 rounded-xl mb-3 overflow-hidden"
        style={{ height: ITEM_HEIGHT }}
      >
        <LinearGradient
          colors={['rgba(125, 91, 166, 0.1)', 'rgba(125, 91, 166, 0.2)', 'rgba(125, 91, 166, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-full h-full"
        />
      </Animated.View>
    ));
  };

  const filteredLocations = getFilteredLocations();

  // Get cities for the selected state
  const getCitiesForState = (state: string) => {
    if (!state) return [];
    return CITIES[state] || [];
  };

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    setSelectedCity(""); // Reset city when state changes
    setStateDropdownOpen(false);
    setShowError(false);
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    setCityDropdownOpen(false);
    setShowError(false);
  };

  const handleSetLocation = async () => {
    if (!selectedState || !selectedCity) {
      setShowError(true);
      return;
    }

    try {
      const locationData = `${selectedCity}, ${selectedState}`;
      const success = await updateLocation(locationData);
      
      if (success) {
        router.push('/onboarding/photos');
      } else {
        toast.show("Failed to save location. Please try again.", "error");
      }
    } catch (error) {
      console.error('Location update error:', error);
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
        <Text style={styles.title}>Where Are You Based?</Text>
        
        <Text style={styles.subtitle}>
          We'll help connect you with nearby explorers.
        </Text>
        
        <View style={styles.formContainer}>
          <Text style={styles.inputLabel}>Select State</Text>
          <TouchableOpacity 
            style={styles.dropdown}
            onPress={() => setStateDropdownOpen(!stateDropdownOpen)}
            activeOpacity={0.7}
          >
            <Text style={selectedState ? styles.dropdownText : styles.placeholderText}>
              {selectedState || "Choose your state"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <Text style={[styles.inputLabel, { marginTop: 24 }]}>Select City</Text>
          <TouchableOpacity 
            style={[
              styles.dropdown, 
              !selectedState && styles.disabledDropdown
            ]}
            onPress={() => selectedState && setCityDropdownOpen(!cityDropdownOpen)}
            activeOpacity={selectedState ? 0.7 : 1}
          >
            <Text style={selectedCity ? styles.dropdownText : styles.placeholderText}>
              {selectedCity || "Choose your city"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
            <Text style={styles.infoText}>
              Accurate location makes matching smoother.
            </Text>
          </View>
        </View>
        
        {showError && (
          <Text style={styles.errorText}>
            Please select both state and city to continue.
          </Text>
        )}
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.setLocationButton,
            (!selectedState || !selectedCity) && styles.disabledButton
          ]}
          onPress={handleSetLocation}
          disabled={isLoading || !selectedState || !selectedCity}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.buttonText}>Set My Location</Text>
          )}
        </TouchableOpacity>
      </View>
      
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
    paddingTop: 24,
    paddingBottom: 16,
  },
  logo: {
    width: 100,
    height: 100,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100, // Space for fixed button
  },
  title: {
    fontSize: 28,
    fontFamily: 'montserratBold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'montserrat',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 40,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'montserrat',
    color: '#6B7280',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  disabledDropdown: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  dropdownText: {
    fontSize: 16,
    fontFamily: 'montserrat',
    color: '#111827',
  },
  placeholderText: {
    fontSize: 16,
    fontFamily: 'montserrat',
    color: '#9CA3AF',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  infoText: {
    fontFamily: 'montserrat',
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 8,
  },
  errorText: {
    fontFamily: 'montserrat',
    fontSize: 14,
    color: '#EF4444',
    marginBottom: 16,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  setLocationButton: {
    backgroundColor: '#00CEC9',
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#00CEC9",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    // Gradient effect will be simulated with backgroundColor
    // In a real app, you'd use LinearGradient component
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
  },
  buttonText: {
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
  },
});
