import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';

// Mock data for Indian states and cities
type LocationDataType = {
  [state: string]: string[];
};

const LOCATION_DATA: LocationDataType = {
  "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik"],
  "Delhi": ["New Delhi", "North Delhi", "South Delhi", "East Delhi", "West Delhi"],
  "Karnataka": ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum"],
  "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
  "Uttar Pradesh": ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut"],
  "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
  "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
  "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri"],
  "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer"],
  "Kerala": ["Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam"]
};

// Type for location selection
type FilteredLocationsType = {
  type: 'states' | 'cities';
  data: string[];
};

export default function EditLocationScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [userGeoLocation, setUserGeoLocation] = useState<Location.LocationObject | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchUserLocation();
  }, []);

  const fetchUserLocation = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch('http://10.0.2.2:5000/api/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === "success" && data.user) {
          // Parse location data - format is typically "City, State"
          if (data.user.location) {
            const locationParts = data.user.location.split(', ');
            
            if (locationParts.length === 2) {
              const [city, state] = locationParts;
              
              // Check if state exists in our data
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
      setIsGettingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required');
        setIsGettingLocation(false);
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
        
        // Find the best match in our dataset
        if (region) {
          // Look for exact or closest state match
          const stateMatch = Object.keys(LOCATION_DATA).find(
            state => state.toLowerCase() === region.toLowerCase()
          );
          
          if (stateMatch) {
            setSelectedState(stateMatch);
            
            if (city && LOCATION_DATA[stateMatch].includes(city)) {
              setSelectedCity(city);
              setHasChanges(true);
            } else {
              setSelectedCity(null);
            }
          }
        }
        
        Alert.alert(
          'Location Found',
          `We found your location as${city ? ' ' + city : ''}${region ? ', ' + region : ''}. Please select your city from the list for better accuracy.`
        );
      } else {
        Alert.alert('Location Error', 'Could not determine your location. Please select manually.');
      }
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your current location');
    } finally {
      setIsGettingLocation(false);
    }
  };

  const getFilteredLocations = (): FilteredLocationsType => {
    // If search query is empty and no state is selected, show states
    if (!searchQuery && !selectedState) {
      return {
        type: 'states',
        data: Object.keys(LOCATION_DATA)
      };
    }
    
    // If search query exists but no state is selected, search states
    if (searchQuery && !selectedState) {
      const filteredStates = Object.keys(LOCATION_DATA).filter(
        state => state.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return {
        type: 'states',
        data: filteredStates
      };
    }
    
    // If state is selected but no search query, show all cities for that state
    if (selectedState && !searchQuery) {
      return {
        type: 'cities',
        data: LOCATION_DATA[selectedState] || []
      };
    }
    
    // If state is selected and search query exists, filter cities
    if (selectedState && searchQuery) {
      const filteredCities = LOCATION_DATA[selectedState].filter(
        city => city.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return {
        type: 'cities',
        data: filteredCities
      };
    }
    
    // Default case (shouldn't reach here)
    return { type: 'states', data: [] };
  };

  const handleSelect = (item: string) => {
    const { type } = getFilteredLocations();
    
    if (type === 'states') {
      setSelectedState(item);
      setSelectedCity(null);
      setSearchQuery('');
    } else {
      setSelectedCity(item);
      setHasChanges(true);
    }
  };

  const handleBack = () => {
    if (selectedState && !selectedCity) {
      // Go back to state selection
      setSelectedState(null);
      setSearchQuery('');
    } else {
      router.back();
    }
  };

  const handleSave = async () => {
    if (!selectedState || !selectedCity) {
      Alert.alert('Incomplete Location', 'Please select both state and city');
      return;
    }

    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const locationString = `${selectedCity}, ${selectedState}`;
      
      const response = await fetch('http://10.0.2.2:5000/api/update/location', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ location: locationString })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.status === 'success') {
          Alert.alert('Success', 'Location updated successfully');
          setHasChanges(false);
          router.back();
        } else {
          Alert.alert('Error', result.message || 'Failed to update location');
        }
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Request failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving location:', error);
      Alert.alert('Error', 'Failed to save location');
    } finally {
      setIsSaving(false);
    }
  };

  const renderLocationItem = ({ item }: { item: string }) => {
    const { type } = getFilteredLocations();
    const isSelected = 
      (type === 'states' && item === selectedState) || 
      (type === 'cities' && item === selectedCity);
    
    return (
      <TouchableOpacity
        onPress={() => handleSelect(item)}
        className={`p-4 border-b border-neutral-medium ${
          isSelected ? 'bg-primary/10' : 'bg-neutral-lightest'
        }`}
      >
        <View className="flex-row items-center">
          <Ionicons 
            name={type === 'states' ? 'location' : 'navigate'} 
            size={20} 
            color={isSelected ? '#7D5BA6' : '#9CA3AF'} 
          />
          <Text className={`ml-3 font-montserrat ${
            isSelected ? 'text-primary font-montserratMedium' : 'text-neutral-dark'
          }`}>
            {item}
          </Text>
          {isSelected && (
            <View className="ml-auto">
              <Ionicons name="checkmark-circle" size={20} color="#7D5BA6" />
            </View>
          )}
        </View>
        
        {type === 'states' && (
          <Text className="mt-1 ml-7 text-xs text-neutral-dark font-montserrat">
            {LOCATION_DATA[item].length} cities available
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-neutral-light justify-center items-center">
        <ActivityIndicator size="large" color="#7D5BA6" />
        <Text className="mt-4 text-primary font-montserrat">Loading location data...</Text>
      </View>
    );
  }

  const filteredLocations = getFilteredLocations();

  return (
    <View className="flex-1 bg-neutral-light">
      <Animated.View 
        entering={FadeInDown.duration(500)}
        className="bg-neutral-lightest px-6 pt-6 pb-4 border-b border-neutral-medium"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={handleBack}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#7D5BA6" />
            <Text className="ml-2 text-primary font-montserratMedium">Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-youngSerif text-primary-dark">
            {selectedState && !selectedCity
              ? `Cities in ${selectedState}`
              : 'Select Location'
            }
          </Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isSaving || !selectedCity || !hasChanges}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#7D5BA6" />
            ) : (
              <Text className={`font-montserratMedium ${
                (selectedCity && hasChanges) 
                  ? 'text-primary' 
                  : 'text-neutral-dark/40'
              }`}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <View className="p-4">
        <View className="flex-row items-center bg-neutral-lightest rounded-full px-4 py-2 border border-neutral-medium">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={selectedState ? "Search cities..." : "Search states..."}
            className="flex-1 ml-2 font-montserrat text-neutral-darkest"
            autoCapitalize="words"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {selectedState && (
          <View className="flex-row mt-4 items-center">
            <Text className="text-neutral-dark font-montserrat">
              Selected state:
            </Text>
            <View className="flex-row items-center bg-primary/10 rounded-full px-3 py-1 ml-2">
              <Text className="text-primary font-montserratMedium">{selectedState}</Text>
              <TouchableOpacity 
                onPress={() => {
                  setSelectedState(null);
                  setSelectedCity(null);
                  setSearchQuery('');
                }}
                className="ml-1"
              >
                <Ionicons name="close-circle" size={16} color="#7D5BA6" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {selectedCity && (
          <View className="flex-row mt-2 items-center">
            <Text className="text-neutral-dark font-montserrat">
              Selected city:
            </Text>
            <View className="flex-row items-center bg-primary/10 rounded-full px-3 py-1 ml-2">
              <Text className="text-primary font-montserratMedium">{selectedCity}</Text>
            </View>
          </View>
        )}
      </View>

      {filteredLocations.data.length > 0 ? (
        <FlatList
          data={filteredLocations.data}
          renderItem={renderLocationItem}
          keyExtractor={item => item}
          className="flex-1 bg-neutral-lightest mx-4 rounded-2xl overflow-hidden"
        />
      ) : (
        <View className="flex-1 items-center justify-center p-6 mx-4 bg-neutral-lightest rounded-2xl">
          <Ionicons name="location-outline" size={48} color="#D6D6D6" />
          <Text className="mt-4 text-neutral-dark text-center font-montserrat">
            No {filteredLocations.type} found matching "{searchQuery}"
          </Text>
          <TouchableOpacity 
            onPress={() => setSearchQuery('')}
            className="mt-4 bg-primary/10 px-4 py-2 rounded-full"
          >
            <Text className="text-primary font-montserratMedium">Clear Search</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        onPress={requestCurrentLocation}
        disabled={isGettingLocation}
        className="m-4 bg-primary rounded-2xl p-4 flex-row items-center justify-center"
      >
        {isGettingLocation ? (
          <View className="flex-row items-center">
            <ActivityIndicator size="small" color="#fff" />
            <Text className="ml-2 text-white font-montserratMedium">Detecting location...</Text>
          </View>
        ) : (
          <>
            <Ionicons name="compass" size={24} color="#fff" />
            <Text className="ml-2 text-white font-montserratMedium">Use My Current Location</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
} 