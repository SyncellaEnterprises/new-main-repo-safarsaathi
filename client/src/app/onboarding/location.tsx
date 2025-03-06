import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  SlideInRight,
  useAnimatedStyle,
  withSpring,
  useSharedValue
} from "react-native-reanimated";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import * as Location from 'expo-location';

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
  const scale = useSharedValue(1);

  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = async () => {
    try {
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
      toast.show("Please select your location", "error");
      return;
    }

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
      toast.show("Failed to save location. Please try again.", "error");
    }
  };

  const filteredLocations = getFilteredLocations();

  return (
    <View className="flex-1 bg-primary-light">
      <Animated.View
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 p-6"
      >
        <View className="flex-row items-center mb-2">
          {selectedState && (
            <TouchableOpacity 
              onPress={handleBack}
              className="mr-4"
            >
              <Ionicons name="arrow-back" size={24} color="#6366f1" />
            </TouchableOpacity>
          )}
          <Text className="text-3xl font-bold text-indigo-600">
            {selectedState ? 'Select City' : 'Select State'}
          </Text>
        </View>
        <Text className="text-slate-500 mb-6">
          {selectedState ? `Cities in ${selectedState}` : 'Choose your state'}
        </Text>

        <View className="relative mb-4">
          <TextInput
            value={searchQuery}
            onChangeText={(text) => setSearchQuery(text)}
            placeholder={selectedState ? "Search cities..." : "Search states..."}
            className="bg-white px-4 py-3 pr-10 rounded-xl border border-indigo-100"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor="#9CA3AF"
          />
          <View className="absolute right-3 top-3">
            <Ionicons 
              name={searchQuery ? "close-circle" : "search"} 
              size={24} 
              color="#6366f1"
              onPress={() => searchQuery ? setSearchQuery("") : null}
            />
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="space-y-2">
            {filteredLocations.data.length > 0 ? (
              filteredLocations.data.map((item: string, index: number) => (
                <Animated.View
                  key={item}
                  entering={SlideInRight.delay(index * 50)}
                >
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    className={`p-4 rounded-xl border shadow-sm ${
                      (selectedState === item || selectedCity === item)
                        ? 'bg-indigo-600 border-indigo-500'
                        : 'bg-white border-indigo-100'
                    }`}
                    style={{
                      elevation: (selectedState === item || selectedCity === item) ? 4 : 1,
                    }}
                    disabled={isLoading}
                  >
                    <Text 
                      className={`text-lg font-medium ${
                        (selectedState === item || selectedCity === item) ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {item}
                      {searchQuery && item.toLowerCase().startsWith(searchQuery.toLowerCase().trim()) && (
                        <Text className="text-xs text-indigo-400"> (Best match)</Text>
                      )}
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              ))
            ) : (
              <View className="items-center py-4">
                <Text className="text-slate-500">No {filteredLocations.type} found</Text>
              </View>
            )}
          </View>
          <View className="h-6" />
        </ScrollView>

        <TouchableOpacity
          onPress={handleNext}
          disabled={!selectedState || !selectedCity || isLoading}
          className={`py-4 rounded-xl mt-6 shadow-sm ${
            (selectedState && selectedCity) ? 'bg-indigo-600' : 'bg-slate-300'
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              {selectedState && selectedCity ? 'Continue' : 'Select your location'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
