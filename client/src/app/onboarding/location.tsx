import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Image, Platform, SafeAreaView, StatusBar, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  FadeIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
  useAnimatedScrollHandler,
  Extrapolation
} from "react-native-reanimated";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import IMAGES from "@/src/constants/images";

const { width, height } = Dimensions.get('window');
const ITEM_HEIGHT = 70;

// Consolidated location data
const LOCATION_DATA: { [state: string]: string[] } = {
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

const statusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;

export default function LocationScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateLocation, isLoading } = useOnboarding();
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>('');
  const [isLocationLoading, setIsLocationLoading] = useState(false);
  const [stateDropdownOpen, setStateDropdownOpen] = useState<boolean>(false);
  const [cityDropdownOpen, setCityDropdownOpen] = useState<boolean>(false);
  const [showError, setShowError] = useState<boolean>(false);
  const scrollY = useSharedValue(0);
  
  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.8],
      Extrapolation.CLAMP
    ),
    transform: [{
      translateY: interpolate(
        scrollY.value,
        [0, 100],
        [0, -10],
        Extrapolation.CLAMP
      ),
    }],
  }));

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
      setIsLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        toast.show('Permission to access location was denied', 'error');
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

  const handleStateSelect = (state: string) => {
    setSelectedState(state);
    setSelectedCity(null);
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
      const locationData = {
        state: selectedState,
        city: selectedCity,
        ...(location && {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }),
        address: `${selectedCity}, ${selectedState}`
      };

      const success = await updateLocation(JSON.stringify(locationData));
      if (success) {
        router.push('/onboarding/interests');
      } else {
        toast.show("Failed to save location. Please try again.", "error");
      }
    } catch (error) {
      console.error('Location update error:', error);
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
        onScroll={scrollHandler}
        scrollEventThrottle={16}
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
            activeOpacity={0.9}
          >
            <Text style={selectedState ? styles.dropdownText : styles.placeholderText}>
              {selectedState || "Choose your state"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          {stateDropdownOpen && (
            <ScrollView style={styles.dropdownList} nestedScrollEnabled>
              {Object.keys(LOCATION_DATA).map((state) => (
                <TouchableOpacity
                  key={state}
                  style={styles.dropdownItem}
                  onPress={() => handleStateSelect(state)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.dropdownItemText}>{state}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          <Text style={[styles.inputLabel, { marginTop: 24 }]}>Select City</Text>
          <TouchableOpacity 
            style={[
              styles.dropdown, 
              !selectedState && styles.disabledDropdown
            ]}
            onPress={() => selectedState && setCityDropdownOpen(!cityDropdownOpen)}
            activeOpacity={selectedState ? 0.9 : 1}
          >
            <Text style={selectedCity ? styles.dropdownText : styles.placeholderText}>
              {selectedCity || "Choose your city"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
          </TouchableOpacity>
          
          {cityDropdownOpen && selectedState && (
            <ScrollView style={styles.dropdownList} nestedScrollEnabled>
              {LOCATION_DATA[selectedState].map((city) => (
                <TouchableOpacity
                  key={city}
                  style={styles.dropdownItem}
                  onPress={() => handleCitySelect(city)}
                  activeOpacity={0.9}
                >
                  <Text style={styles.dropdownItemText}>{city}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          
          {/* Tooltip */}
          <View style={styles.tooltipContainer}>
            <Ionicons name="information-circle" size={22} color="#00CEC9" />
            <Text style={styles.tooltipText}>
              Accurate location helps us connect you with travel companions in your area.
            </Text>
          </View>
        </View>
        
        {showError && (
          <Text style={styles.errorText}>
            Please select both state and city to continue.
          </Text>
        )}
        
        {/* Page Indicators */}
        <View style={styles.pageIndicators}>
          <View style={styles.indicator} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
          <View style={styles.indicator} />
          <View style={[styles.indicator, styles.activeIndicator]} />
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.setLocationButton,
            (!selectedState || !selectedCity) && styles.disabledButton
          ]}
          onPress={handleSetLocation}
          activeOpacity={0.9}
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
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontFamily: 'montserratBold',
    fontWeight: 'bold',
    color: '#00CEC9',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'montserrat',
    color: 'grey',
    textAlign: 'center',
    marginBottom: 40,
  },
  formContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontFamily: 'montserratMedium',
    color: '#374151',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  disabledDropdown: {
    opacity: 0.5,
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
  dropdownList: {
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  dropdownItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: 'montserrat',
    color: '#111827',
  },
  tooltipContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0, 206, 201, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
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
    fontSize: 14,
    fontFamily: 'montserrat',
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 8,
    marginTop: 24,
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
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 24 + statusBarHeight,
    paddingTop: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  setLocationButton: {
    backgroundColor: '#00CEC9',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
  },
  buttonText: {
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
