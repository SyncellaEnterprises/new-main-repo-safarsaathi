import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  SlideInRight,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  FadeIn,
  ZoomIn
} from "react-native-reanimated";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

type LocationDataType = {
  [state: string]: string[];
};

// Hardcoded states and cities data
const LOCATION_DATA: LocationDataType = {
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Kakinada", "Tirupati", "Rajahmundry", "Kadapa", "Anantapur"
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
  const scale = useSharedValue(1);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSkeletonVisible(false);
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
        className="bg-neutral-dark/50 rounded-xl mb-2 overflow-hidden"
        style={{ height: 56 }}
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

  return (
    <View className="flex-1 bg-neutral-darkest">
      <Animated.View
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 p-6"
      >
        {/* Header */}
        <View className="mb-4">
          <View className="flex-row items-center mb-2">
            {selectedState && (
              <TouchableOpacity 
                onPress={handleBack}
                className="mr-4 bg-neutral-dark/80 p-2 rounded-full"
              >
                <Ionicons name="arrow-back" size={20} color="#9D7EBD" />
              </TouchableOpacity>
            )}
            <Text className="text-3xl font-bold text-primary font-youngSerif">
              {selectedState ? 'Select City' : 'Select State'}
            </Text>
          </View>
          <Text className="text-neutral-medium mb-1 font-montserrat">
            {selectedState ? `Cities in ${selectedState}` : 'Choose your state'}
          </Text>
          
          {submitError && (
            <Animated.View 
              entering={SlideInRight}
              className="mt-3 bg-red-900/30 border border-red-500/30 rounded-lg p-3 flex-row items-center"
            >
              <Ionicons name="alert-circle" size={20} color="#f87171" />
              <Text className="text-red-400 ml-2 font-montserrat">{submitError}</Text>
            </Animated.View>
          )}
        </View>

        {/* Current Location Card */}
        {address && (
          <BlurView intensity={20} tint="dark" className="rounded-2xl mb-4 overflow-hidden">
            <LinearGradient
              colors={['rgba(125, 91, 166, 0.1)', 'rgba(157, 126, 189, 0.05)']}
              className="p-4 border border-primary-light/20"
              style={{ borderRadius: 16 }}
            >
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                  <Ionicons name="locate" size={20} color="#9D7EBD" />
                </View>
                <View className="flex-1">
                  <Text className="text-neutral-light font-montserratMedium mb-1">Current Location</Text>
                  <Text className="text-neutral-medium text-sm font-montserrat">
                    {isLocationLoading ? 'Detecting your location...' : address}
                  </Text>
                  {(selectedState && selectedCity) && (
                    <View className="bg-primary/20 px-3 py-1 rounded-full self-start mt-2">
                      <Text className="text-primary-light text-xs font-montserratMedium">
                        {selectedCity}, {selectedState}
                      </Text>
                    </View>
                  )}
                </View>
                {isLocationLoading && (
                  <ActivityIndicator size="small" color="#9D7EBD" />
                )}
              </View>
            </LinearGradient>
          </BlurView>
        )}

        {/* Search Bar */}
        <View className="relative mb-4">
          <BlurView intensity={15} tint="dark" className="overflow-hidden rounded-xl">
            <LinearGradient
              colors={['rgba(30, 27, 38, 0.8)', 'rgba(30, 27, 38, 0.6)']}
              className="border border-primary-light/20 rounded-xl"
            >
              <View className="flex-row items-center">
                <Ionicons 
                  name="search" 
                  size={20} 
                  color="#7D5BA6" 
                  style={{ marginLeft: 12 }}
                />
                <TextInput
                  value={searchQuery}
                  onChangeText={(text) => setSearchQuery(text)}
                  placeholder={selectedState ? "Search cities..." : "Search states..."}
                  className="flex-1 px-3 py-3.5 text-neutral-light font-montserrat"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#686680"
                />
                {searchQuery ? (
                  <TouchableOpacity 
                    onPress={() => setSearchQuery("")}
                    className="mr-3"
                  >
                    <Ionicons name="close-circle" size={20} color="#7D5BA6" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </LinearGradient>
          </BlurView>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="space-y-2">
            {isSkeletonVisible ? (
              renderSkeletons()
            ) : filteredLocations.data.length > 0 ? (
              filteredLocations.data.map((item: string, index: number) => (
                <Animated.View
                  key={item}
                  entering={SlideInRight.delay(index * 50)}
                >
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    className={`p-4 rounded-xl shadow-lg overflow-hidden ${
                      (selectedState === item || selectedCity === item)
                        ? 'border border-primary' 
                        : 'border border-primary-light/20'
                    }`}
                    style={{
                      elevation: (selectedState === item || selectedCity === item) ? 4 : 1,
                    }}
                    disabled={isLoading}
                  >
                    <LinearGradient
                      colors={(selectedState === item || selectedCity === item)
                        ? ['rgba(125, 91, 166, 0.3)', 'rgba(125, 91, 166, 0.1)']
                        : ['rgba(30, 27, 38, 0.8)', 'rgba(30, 27, 38, 0.6)']}
                      className="absolute inset-0"
                    />
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons 
                          name={filteredLocations.type === 'states' ? 'map-outline' : 'location-outline'} 
                          size={20} 
                          color={(selectedState === item || selectedCity === item) ? '#fff' : '#9D7EBD'} 
                          style={{ marginRight: 12 }}
                        />
                        <Text 
                          className={`text-lg ${
                            (selectedState === item || selectedCity === item) 
                              ? 'text-white font-montserratMedium' 
                              : 'text-neutral-light font-montserrat'
                          }`}
                        >
                          {item}
                        </Text>
                      </View>
                      {(selectedState === item || selectedCity === item) && (
                        <Ionicons name="checkmark-circle" size={20} color="#50A6A7" />
                      )}
                    </View>
                    {searchQuery && item.toLowerCase().startsWith(searchQuery.toLowerCase().trim()) && (
                      <Text className="text-xs text-primary-light ml-8 mt-1">Best match</Text>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              ))
            ) : (
              <View className="items-center py-8 bg-neutral-dark/30 rounded-xl">
                <Ionicons name="search" size={40} color="#686680" />
                <Text className="text-neutral-medium font-montserrat mt-4">No {filteredLocations.type} found</Text>
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  className="mt-4 bg-primary/20 px-4 py-2 rounded-lg"
                >
                  <Text className="text-primary-light font-montserratMedium">Clear search</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View className="h-16" />
        </ScrollView>

        {/* Continue Button */}
        <View className="absolute bottom-6 left-6 right-6">
          <LinearGradient
            colors={(selectedState && selectedCity) ? ['#7D5BA6', '#9D7EBD'] : ['#3E3C47', '#3E3C47']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-xl overflow-hidden"
          >
            <TouchableOpacity
              onPress={handleNext}
              disabled={!selectedState || !selectedCity || isLoading || isSkeletonVisible}
              className="py-4 px-6"
            >
              {isLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white ml-2 font-montserratBold">Saving...</Text>
                </View>
              ) : (
                <View className="flex-row items-center justify-center">
                  <Text className={`text-center text-lg font-montserratBold ${
                    (selectedState && selectedCity) ? 'text-white' : 'text-neutral-medium'
                  }`}>
                    {selectedState && selectedCity ? 'Continue' : 'Select your location'}
                  </Text>
                  {(selectedState && selectedCity) && (
                    <Ionicons name="arrow-forward" size={20} color="white" className="ml-2" />
                  )}
                </View>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Animated.View>
    </View>
  );
}
