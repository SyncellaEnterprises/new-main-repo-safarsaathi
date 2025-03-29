import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, SlideInRight, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import React from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';

// Hardcoded states and cities data - same as in location.tsx
type LocationDataType = {
  [state: string]: string[];
};

const LOCATION_DATA: LocationDataType = {
  "Andhra Pradesh": [
    "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool"
  ],
  "Assam": [
    "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon"
  ],
  "Bihar": [
    "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"
  ],
  "Gujarat": [
    "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"
  ],
  "Karnataka": [
    "Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belagavi"
  ],
  "Kerala": [
    "Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"
  ],
  "Maharashtra": [
    "Mumbai", "Pune", "Nagpur", "Thane", "Nashik"
  ],
  "Punjab": [
    "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"
  ],
  "Tamil Nadu": [
    "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"
  ],
  "Uttar Pradesh": [
    "Lucknow", "Kanpur", "Varanasi", "Agra", "Prayagraj"
  ]
};

type FilteredLocationsType = {
  type: 'states' | 'cities';
  data: string[];
};

export default function EditLocationScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [userGeoLocation, setUserGeoLocation] = useState<Location.LocationObject | null>(null);
  const [currentLocation, setCurrentLocation] = useState('');

  useEffect(() => {
    fetchUserLocation();
  }, []);

  const fetchUserLocation = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch('http://10.0.2.2:5000/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success" && data.user) {
          const locationString = data.user.location || '';
          
          if (locationString) {
            setCurrentLocation(locationString);
            
            // Try to parse location if it's in "City, State" format
            const parts = locationString.split(',').map((part: string) => part.trim());
            if (parts.length === 2) {
              const city = parts[0];
              const state = parts[1];
              
              // Set state if it exists in our data
              if (LOCATION_DATA[state]) {
                setSelectedState(state);
                
                // Set city if it exists in that state
                if (LOCATION_DATA[state].includes(city)) {
                  setSelectedCity(city);
                }
              }
            }
          }
        }
      } else {
        Alert.alert('Error', 'Failed to load location data');
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const requestCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserGeoLocation(location);

      const [addressResult] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (addressResult) {
        const city = addressResult.city;
        const region = addressResult.region;
        
        if (city && region) {
          // Try to find matching state and city
          const state = Object.keys(LOCATION_DATA).find(state => 
            region.toLowerCase().includes(state.toLowerCase())
          );
          
          if (state) {
            setSelectedState(state);
            const matchingCity = LOCATION_DATA[state].find(c => 
              city.toLowerCase().includes(c.toLowerCase())
            );
            if (matchingCity) {
              setSelectedCity(matchingCity);
              setHasChanges(true);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Could not get your current location');
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
      const matchingCities = cities.filter(city => city.toLowerCase().includes(query));
      return { type: 'cities', data: matchingCities };
    } else {
      // Search in states
      const states = Object.keys(LOCATION_DATA);
      const matchingStates = states.filter(state => state.toLowerCase().includes(query));
      return { type: 'states', data: matchingStates };
    }
  };

  const handleSelect = (item: string) => {
    if (selectedState) {
      setSelectedCity(item);
      setHasChanges(true);
    } else {
      setSelectedState(item);
      setSelectedCity(null);
      setSearchQuery('');
    }
  };

  const handleBack = () => {
    if (selectedState) {
      setSelectedState(null);
      setSelectedCity(null);
      setSearchQuery('');
    } else {
      router.replace("/(profile)");
    }
  };

  const handleSave = async () => {
    if (!selectedState || !selectedCity) {
      Alert.alert('Incomplete', 'Please select both state and city');
      return;
    }

    if (!hasChanges) {
      Alert.alert('No Changes', 'No changes were made to your location');
      return;
    }
    
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const locationValue = `${selectedCity}, ${selectedState}`;
      
      const response = await fetch('http://10.0.2.2:5000/api/update/location', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ location: locationValue })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Update location response:', result);
      
      if (result.status === 'success') {
        Alert.alert('Success', 'Location updated successfully', [
          { 
            text: 'OK', 
            onPress: () => {
              setHasChanges(false);
              router.replace("/(profile)");
            }
          }
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to update location');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredLocations = getFilteredLocations();

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F8FAFF] justify-center items-center">
        <ActivityIndicator size="large" color="#1a237e" />
        <Text className="mt-4 text-[#1a237e]">Loading location data...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFF]">
      <Animated.View 
        entering={FadeInDown.duration(500)}
        className="bg-white px-6 pt-6 pb-4 border-b border-slate-100"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={handleBack}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#1a237e" />
            <Text className="ml-2 text-[#1a237e]">Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-[#1a237e]">
            {selectedState ? 'Select City' : 'Select State'}
          </Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isSaving || !hasChanges || !selectedState || !selectedCity}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#1a237e" />
            ) : (
              <Text className={`font-semibold ${(hasChanges && selectedState && selectedCity) ? 'text-[#1a237e]' : 'text-gray-400'}`}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-2xl font-bold text-[#1a237e] mb-2">
          {selectedState ? `Cities in ${selectedState}` : 'Select Your State'}
        </Text>
        <Text className="text-slate-500 mb-6">
          {selectedState 
            ? 'Choose your city for better local connections' 
            : 'Choose your state to find nearby travel companions'
          }
        </Text>

        <Animated.View 
          entering={SlideInRight.delay(100)}
          className="mb-6"
        >
          <View className="relative">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={selectedState ? "Search cities..." : "Search states..."}
              className="bg-white rounded-xl px-4 py-3 pl-12 border-2 border-slate-200 focus:border-[#1a237e]"
            />
            <View className="absolute left-4 top-3.5">
              <Ionicons name="search-outline" size={20} color="#94a3b8" />
            </View>
            {searchQuery.length > 0 && (
              <TouchableOpacity 
                className="absolute right-4 top-3.5"
                onPress={() => setSearchQuery('')}
              >
                <Ionicons name="close-circle" size={20} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        <View className="space-y-2">
          {filteredLocations.data.length > 0 ? (
            filteredLocations.data.map((item, index) => (
              <Animated.View
                key={item}
                entering={SlideInRight.delay(index * 50)}
              >
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  className={`p-4 rounded-xl ${
                    (selectedState === item || selectedCity === item)
                      ? 'bg-indigo-600 shadow-md'
                      : 'bg-white border border-slate-200'
                  }`}
                >
                  <Text className={`text-base font-medium ${
                    (selectedState === item || selectedCity === item)
                      ? 'text-white'
                      : 'text-slate-700'
                  }`}>
                    {item}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))
          ) : (
            <View className="py-8 items-center">
              <Text className="text-slate-500">
                No {filteredLocations.type} found matching "{searchQuery}"
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity 
          className="mt-6 flex-row items-center bg-indigo-50 p-4 rounded-xl"
          onPress={requestCurrentLocation}
        >
          <Ionicons name="location" size={24} color="#1a237e" />
          <View className="ml-3 flex-1">
            <Text className="text-[#1a237e] font-semibold">Use Current Location</Text>
            <Text className="text-slate-600">Automatically detect your location</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#1a237e" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
} 