import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Dimensions, Image, Platform } from "react-native";
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

const { width, height } = Dimensions.get('window');
const ITEM_HEIGHT = 70;

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

  return (
    <View className="flex-1 bg-neutral-darkest">
      {/* Background Gradient */}
      <Animated.View 
        style={[{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: height * 0.7,
          opacity: 0.5,
          zIndex: -1,
        }, bgStyle]}
      >
        <LinearGradient
          colors={['rgba(125, 91, 166, 0.2)', 'rgba(80, 166, 167, 0.1)', 'rgba(30, 27, 38, 0.95)']}
          style={{width: '100%', height: '100%'}}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      {/* Floating Orbs */}
      <Animated.View style={{ 
        position: 'absolute', 
        top: height * 0.15, 
        right: 30,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(125, 91, 166, 0.2)',
        zIndex: -1,
      }} />
      
      <Animated.View style={{ 
        position: 'absolute', 
        top: height * 0.35, 
        left: 20,
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(80, 166, 167, 0.15)',
        zIndex: -1,
      }} />

      <Animated.View
        style={headerStyle}
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 px-6 pt-6"
      >
        {/* Header */}
        <View className="mb-6">
          <LinearGradient
            colors={['#9D7EBD', '#50A6A7']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="self-start rounded-xl px-4 py-1 mb-2"
          >
            <Text className="text-neutral-darkest font-montserratBold">LOCATION</Text>
          </LinearGradient>
          
          <Text className="text-4xl font-bold text-white font-youngSerif">
            {selectedState ? 'Select City' : 'Where are you?'}
          </Text>
          
          <Text className="text-neutral-medium mt-2 text-lg font-montserrat">
            {selectedState ? `Cities in ${selectedState}` : 'Choose your location to find nearby matches'}
          </Text>
          
          {submitError && (
            <Animated.View 
              entering={SlideInRight}
              className="mt-4 bg-red-900/30 border border-red-500/30 rounded-xl p-3 flex-row items-center"
            >
              <Ionicons name="alert-circle" size={22} color="#f87171" />
              <Text className="text-red-400 ml-2 font-montserrat">{submitError}</Text>
            </Animated.View>
          )}
        </View>

        {/* Current Location Card */}
        {address && (
          <Animated.View 
            entering={FadeInUp.delay(300)}
            className="mb-6"
          >
            <BlurView intensity={30} tint="dark" className="rounded-2xl overflow-hidden">
              <LinearGradient
                colors={['rgba(125, 91, 166, 0.2)', 'rgba(157, 126, 189, 0.15)']}
                className="p-4 border border-primary-light/30"
                style={{ borderRadius: 16 }}
              >
                <View className="flex-row items-center">
                  <View className="w-12 h-12 rounded-full bg-primary/30 items-center justify-center mr-4">
                    <Ionicons name="locate-outline" size={26} color="#fff" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-montserratMedium text-lg mb-1">Current Location</Text>
                    <Text className="text-neutral-light text-base font-montserrat">
                      {isLocationLoading ? 'Detecting your location...' : address}
                    </Text>
                    {(selectedState && selectedCity) && (
                      <View className="bg-primary/30 px-4 py-1.5 rounded-full self-start mt-3 border border-primary/30">
                        <Text className="text-white text-sm font-montserratMedium">
                          {selectedCity}, {selectedState}
                        </Text>
                      </View>
                    )}
                  </View>
                  {isLocationLoading ? (
                    <ActivityIndicator size="small" color="#9D7EBD" />
                  ) : (
                    <TouchableOpacity 
                      onPress={requestLocation}
                      className="w-10 h-10 bg-primary/20 rounded-full items-center justify-center"
                    >
                      <Feather name="refresh-cw" size={18} color="#9D7EBD" />
                    </TouchableOpacity>
                  )}
                </View>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        )}

        {/* Search Bar */}
        <Animated.View 
          entering={FadeInUp.delay(400)}
          className="relative mb-5"
        >
          <BlurView intensity={25} tint="dark" className="overflow-hidden rounded-xl">
            <LinearGradient
              colors={['rgba(30, 27, 38, 0.9)', 'rgba(30, 27, 38, 0.7)']}
              className="border border-primary-light/30 rounded-xl"
            >
              <View className="flex-row items-center">
                <Ionicons 
                  name="search" 
                  size={22} 
                  color="#9D7EBD" 
                  style={{ marginLeft: 16 }}
                />
                <TextInput
                  value={searchQuery}
                  onChangeText={(text) => setSearchQuery(text)}
                  placeholder={selectedState ? "Search cities..." : "Search states..."}
                  className="flex-1 px-3 py-4 text-white text-base font-montserrat"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholderTextColor="#686680"
                />
                {searchQuery ? (
                  <TouchableOpacity 
                    onPress={() => setSearchQuery("")}
                    className="mr-4 bg-neutral-dark/80 p-1 rounded-full"
                  >
                    <Ionicons name="close" size={16} color="#9D7EBD" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>

        {/* Results Count */}
        <Animated.View 
          entering={FadeInUp.delay(500)}
          className="mb-3"
        >
          <Text className="text-neutral-light font-montserratMedium">
            {!isSkeletonVisible && filteredLocations.data.length > 0 && 
              `Showing ${filteredLocations.data.length} ${filteredLocations.type}`
            }
          </Text>
        </Animated.View>

        {/* Navigation Bar if in State Selection */}
        {selectedState && (
          <Animated.View 
            entering={SlideInRight}
            className="flex-row items-center mb-3"
          >
            <TouchableOpacity 
              onPress={handleBack}
              className="mr-3 bg-neutral-dark/80 p-2 rounded-full border border-primary-light/20"
            >
              <Ionicons name="arrow-back" size={20} color="#9D7EBD" />
            </TouchableOpacity>
            <View className="flex-1 flex-row items-center">
              <Text className="text-neutral-light font-montserratMedium">
                {selectedState}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#686680" style={{marginHorizontal: 4}} />
              <Text className="text-primary-light font-montserratMedium">
                Select City
              </Text>
            </View>
          </Animated.View>
        )}

        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
        >
          <View className="space-y-3 pb-32">
            {isSkeletonVisible ? (
              renderSkeletons()
            ) : filteredLocations.data.length > 0 ? (
              filteredLocations.data.map((item: string, index: number) => (
                <Animated.View
                  key={item}
                  entering={SlideInRight.delay(index * 50 + 200)}
                >
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    className={`rounded-xl shadow-lg overflow-hidden ${
                      (selectedState === item || selectedCity === item)
                        ? 'border-2 border-primary' 
                        : 'border border-primary-light/30'
                    }`}
                    style={{
                      height: ITEM_HEIGHT,
                      shadowColor: (selectedState === item || selectedCity === item) ? '#7D5BA6' : 'transparent',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 5,
                      elevation: (selectedState === item || selectedCity === item) ? 8 : 2,
                    }}
                    disabled={isLoading}
                  >
                    <BlurView intensity={20} tint="dark" style={{flex: 1}}>
                      <LinearGradient
                        colors={(selectedState === item || selectedCity === item)
                          ? ['rgba(125, 91, 166, 0.3)', 'rgba(125, 91, 166, 0.2)']
                          : ['rgba(30, 27, 38, 0.8)', 'rgba(30, 27, 38, 0.6)']}
                        className="flex-1 p-4"
                      >
                        <View className="flex-row items-center justify-between">
                          <View className="flex-row items-center">
                            <View className={`w-12 h-12 rounded-xl items-center justify-center mr-3 ${
                              (selectedState === item || selectedCity === item) 
                                ? 'bg-primary/30' 
                                : 'bg-neutral-dark/70'
                            }`}>
                              <Ionicons 
                                name={filteredLocations.type === 'states' ? 'map' : 'location'} 
                                size={22} 
                                color={(selectedState === item || selectedCity === item) ? '#fff' : '#9D7EBD'} 
                              />
                            </View>
                            <View>
                              <Text 
                                className={`text-xl ${
                                  (selectedState === item || selectedCity === item) 
                                    ? 'text-white font-montserratBold' 
                                    : 'text-neutral-light font-montserratMedium'
                                }`}
                              >
                                {item}
                              </Text>
                              <Text className="text-neutral-medium font-montserrat mt-1">
                                {filteredLocations.type === 'states' 
                                  ? `${LOCATION_DATA[item].length} cities` 
                                  : 'Tap to select'
                                }
                              </Text>
                            </View>
                          </View>
                          {(selectedState === item || selectedCity === item) && (
                            <View className="bg-secondary/20 w-8 h-8 rounded-full items-center justify-center">
                              <Ionicons name="checkmark" size={20} color="#50A6A7" />
                            </View>
                          )}
                        </View>
                      </LinearGradient>
                    </BlurView>
                  </TouchableOpacity>
                </Animated.View>
              ))
            ) : (
              <Animated.View 
                entering={FadeIn}
                className="items-center py-10 bg-neutral-dark/30 rounded-xl border border-neutral-dark/50"
              >
                <Ionicons name="search" size={50} color="#686680" />
                <Text className="text-neutral-medium font-montserrat mt-4 text-lg">
                  No {filteredLocations.type} found
                </Text>
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  className="mt-5 bg-primary/20 px-5 py-3 rounded-xl border border-primary/30"
                >
                  <Text className="text-primary-light font-montserratMedium">Clear search</Text>
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </ScrollView>

        {/* Continue Button */}
        <View className="absolute bottom-6 left-6 right-6">
          <Animated.View style={buttonScale}>
            <BlurView intensity={30} tint="dark" className="overflow-hidden rounded-xl">
              <LinearGradient
                colors={(selectedState && selectedCity) ? ['#7D5BA6', '#50A6A7'] : ['#3E3C47', '#3E3C47']}
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
                        <Ionicons name="arrow-forward" size={20} color="white" style={{marginLeft: 8}} />
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </BlurView>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}
