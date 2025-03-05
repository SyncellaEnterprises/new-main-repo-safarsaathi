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
import axios from 'axios';
import { API_URL } from '@/src/constants/config';

interface District {
  name: string;
}

export default function LocationScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateLocation, isLoading } = useOnboarding();
  const [searchQuery, setSearchQuery] = useState("");
  const [districts, setDistricts] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>('');
  const [fetchingDistricts, setFetchingDistricts] = useState(true);
  const scale = useSharedValue(1);

  useEffect(() => {
    fetchDistricts();
    requestLocation();
  }, []);

  const fetchDistricts = async () => {
    try {
      setFetchingDistricts(true);
      const response = await axios.get(`${API_URL}/all-districts`);
      if (response.data.data) {
        setDistricts(response.data.data);
      }
    } catch (error) {
      toast.show("Failed to load districts", "error");
      console.error('Error fetching districts:', error);
    } finally {
      setFetchingDistricts(false);
    }
  };

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
        
        // Try to find and select the matching district
        const matchingDistrict = districts.find(district => 
          addressResult.city && district.toLowerCase().includes(addressResult.city.toLowerCase())
        );
        if (matchingDistrict) {
          setSelectedDistrict(matchingDistrict);
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
      toast.show('Error getting location', 'error');
    }
  };

  const filteredDistricts = districts.filter(district =>
    district.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectDistrict = (district: string) => {
    scale.value = withSpring(1.05, {}, () => {
      scale.value = withSpring(1);
    });
    setSelectedDistrict(district);
  };

  const handleNext = async () => {
    if (!selectedDistrict) {
      toast.show("Please select your district", "error");
      return;
    }

    const locationData = {
      district: selectedDistrict,
      ...(location && {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }),
      address
    };

    const success = await updateLocation(JSON.stringify(locationData));
    if (success) {
      router.push('/onboarding/bio');
    } else {
      toast.show("Failed to save location. Please try again.", "error");
    }
  };

  if (fetchingDistricts) {
    return (
      <View className="flex-1 bg-primary-light items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-slate-600 mt-4">Loading districts...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-primary-light">
      <Animated.View
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 p-6"
      >
        <Text className="text-3xl font-bold mb-2 text-indigo-600">
          Where are you from?
        </Text>
        <Text className="text-slate-500 mb-6">
          Select your district
        </Text>

        <View className="relative mb-4">
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search districts..."
            className="bg-white px-4 py-3 pr-10 rounded-xl border border-indigo-100"
          />
          <View className="absolute right-3 top-3">
            <Ionicons name="search" size={24} color="#6366f1" />
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="space-y-2">
            {filteredDistricts.map((district, index) => (
              <Animated.View
                key={district}
                entering={SlideInRight.delay(index * 100)}
              >
                <TouchableOpacity
                  onPress={() => handleSelectDistrict(district)}
                  className={`p-4 rounded-xl border shadow-sm ${
                    selectedDistrict === district
                      ? 'bg-indigo-600 border-indigo-500'
                      : 'bg-white border-indigo-100'
                  }`}
                  style={{
                    elevation: selectedDistrict === district ? 4 : 1,
                  }}
                  disabled={isLoading}
                >
                  <Text 
                    className={`text-lg font-medium ${
                      selectedDistrict === district ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {district}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
          <View className="h-6" />
        </ScrollView>

        <TouchableOpacity
          onPress={handleNext}
          disabled={!selectedDistrict || isLoading}
          className={`py-4 rounded-xl mt-6 shadow-sm ${
            selectedDistrict ? 'bg-indigo-600' : 'bg-slate-300'
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              {selectedDistrict ? 'Continue' : 'Select your district'}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}
