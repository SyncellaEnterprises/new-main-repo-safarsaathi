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

interface District {
  id: string;
  name: string;
  state: string;
}

export default function LocationScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updateLocation, isLoading } = useOnboarding();
  const [searchQuery, setSearchQuery] = useState("");
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>('');
  const scale = useSharedValue(1);

  useEffect(() => {
    fetchLocations();
    requestLocation();
  }, []);

  const fetchLocations = async () => {
    try {
      const response = await fetch('https://api.example.com/india/districts');
      const data = await response.json();
      setDistricts(data);
    } catch (error) {
      toast.show("Failed to load locations", "error");
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
        const formattedAddress = `${addressResult.city}, ${addressResult.region}`;
        setAddress(formattedAddress);
      }
    } catch (error) {
      toast.show('Error getting location', 'error');
    }
  };

  const filteredDistricts = districts.filter(district =>
    district.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectDistrict = (district: District) => {
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
      district: selectedDistrict.name,
      state: selectedDistrict.state,
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
                key={district.id}
                entering={SlideInRight.delay(index * 100)}
              >
                <TouchableOpacity
                  onPress={() => handleSelectDistrict(district)}
                  className={`p-4 rounded-xl border shadow-sm ${
                    selectedDistrict?.id === district.id
                      ? 'bg-indigo-600 border-indigo-500'
                      : 'bg-white border-indigo-100'
                  }`}
                  style={{
                    elevation: selectedDistrict?.id === district.id ? 4 : 1,
                  }}
                  disabled={isLoading}
                >
                  <Text 
                    className={`text-lg font-medium ${
                      selectedDistrict?.id === district.id ? 'text-white' : 'text-slate-700'
                    }`}
                  >
                    {district.name}
                  </Text>
                  <Text 
                    className={`text-sm ${
                      selectedDistrict?.id === district.id ? 'text-indigo-100' : 'text-slate-500'
                    }`}
                  >
                    {district.state}
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
