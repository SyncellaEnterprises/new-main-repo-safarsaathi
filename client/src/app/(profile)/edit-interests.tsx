import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';

interface InterestCategory {
  id: string;
  name: string;
  icon: string;
  interests: string[];
}

const INTEREST_CATEGORIES: InterestCategory[] = [
  {
    id: 'outdoor',
    name: 'Outdoor Activities',
    icon: 'leaf-outline',
    interests: ['Hiking', 'Camping', 'Beach', 'Cycling', 'Rock Climbing', 'Fishing']
  },
  {
    id: 'culture',
    name: 'Culture & Arts',
    icon: 'color-palette-outline',
    interests: ['Museums', 'Theater', 'Photography', 'Music', 'Dance', 'Art']
  },
  {
    id: 'food',
    name: 'Food & Dining',
    icon: 'restaurant-outline',
    interests: ['Local Food', 'Cooking', 'Wine Tasting', 'Cafes', 'Street Food']
  },
  {
    id: 'travel',
    name: 'Travel Style',
    icon: 'airplane-outline',
    interests: ['Adventure', 'Backpacking', 'Luxury', 'Road Trips', 'Solo Travel']
  },
  {
    id: 'social',
    name: 'Social Activities',
    icon: 'people-outline',
    interests: ['Board Games', 'Karaoke', 'Dancing', 'Sports', 'Volunteering']
  }
];

export default function EditInterestsScreen() {
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const MAX_INTERESTS = 8;
  const MIN_INTERESTS = 3;

  useEffect(() => {
    fetchUserInterests();
  }, []);

  const fetchUserInterests = async () => {
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
          // Handle different interest formats - could be array or string with format {item1,item2}
          let interests: string[] = [];
          
          if (data.user.interest) {
            if (Array.isArray(data.user.interest)) {
              interests = data.user.interest;
            } else if (typeof data.user.interest === 'string') {
              // Handle format like "{Cooking,\"Street Food\",Backpacking}"
              const interestsString = data.user.interest.replace(/[{}]/g, '');
              interests = interestsString.split(',').map((item: string) => {
                // Remove quotes and trim
                return item.replace(/"/g, '').trim();
              });
            }
          }
          
          setSelectedInterests(interests);
        }
      } else {
        Alert.alert('Error', 'Failed to load interests');
      }
    } catch (error) {
      console.error('Error fetching interests:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(prev => prev.filter(i => i !== interest));
      setHasChanges(true);
    } else if (selectedInterests.length < MAX_INTERESTS) {
      setSelectedInterests(prev => [...prev, interest]);
      setHasChanges(true);
    } else {
      Alert.alert('Maximum Reached', `You can select up to ${MAX_INTERESTS} interests.`);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) {
      Alert.alert('No Changes', 'No changes were made to your interests');
      return;
    }

    if (selectedInterests.length < MIN_INTERESTS) {
      Alert.alert('Too Few Interests', `Please select at least ${MIN_INTERESTS} interests.`);
      return;
    }

    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // Format the interest data as the server expects (stringified format)
      // Convert array to string format: "{item1,item2,item3}"
      const formattedInterests = JSON.stringify(selectedInterests)
        .replace('[', '{')
        .replace(']', '}');
      
      console.log('Sending formatted interests:', formattedInterests);
      
      // Use the correct endpoint URL - matches the pattern used in prompts
      const response = await fetch('http://10.0.2.2:5000/api/update/interests', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ interest: formattedInterests })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Request failed with status ${response.status}`);
      }
      
      const result = await response.json();
      console.log('Update interests response:', result);
      
      if (result.status === 'success') {
        Alert.alert('Success', 'Interests updated successfully');
        setHasChanges(false);
        router.back();
      } else {
        Alert.alert('Error', result.message || 'Failed to update interests');
      }
    } catch (error) {
      console.error('Error saving interests:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Check if an entire category is selected
  const isCategorySelected = (category: InterestCategory) => {
    return category.interests.every(interest => selectedInterests.includes(interest));
  };

  // Get the count of selected interests in a category
  const selectedCountInCategory = (category: InterestCategory) => {
    return category.interests.filter(interest => selectedInterests.includes(interest)).length;
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F8FAFF] justify-center items-center">
        <ActivityIndicator size="large" color="#1a237e" />
        <Text className="mt-4 text-[#1a237e]">Loading interests...</Text>
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
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#1a237e" />
            <Text className="ml-2 text-[#1a237e]">Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-[#1a237e]">Interests</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isSaving || !hasChanges || selectedInterests.length < MIN_INTERESTS}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#1a237e" />
            ) : (
              <Text className={`font-semibold ${(hasChanges && selectedInterests.length >= MIN_INTERESTS) ? 'text-[#1a237e]' : 'text-gray-400'}`}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-2xl font-bold text-[#1a237e] mb-2">
          Your Interests
        </Text>
        <Text className="text-slate-500 mb-4">
          Select {MIN_INTERESTS}-{MAX_INTERESTS} interests to help us find better matches
        </Text>
        
        <View className="bg-white px-4 py-3 rounded-xl mb-6 border border-indigo-100">
          <View className="flex-row items-center justify-between">
            <Text className="text-indigo-900 font-medium">
              {selectedInterests.length}/{MAX_INTERESTS} selected
            </Text>
            {selectedInterests.length < MIN_INTERESTS && (
              <Text className="text-red-500 text-sm">
                Select at least {MIN_INTERESTS}
              </Text>
            )}
          </View>
          <View className="h-2 bg-gray-100 rounded-full mt-2">
            <View 
              className={`h-2 rounded-full ${
                selectedInterests.length >= MIN_INTERESTS ? 'bg-green-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${(selectedInterests.length / MAX_INTERESTS) * 100}%` }}
            />
          </View>
        </View>

        {INTEREST_CATEGORIES.map((category, index) => (
          <Animated.View
            key={category.id}
            entering={FadeIn.delay(index * 100)}
            className="mb-8"
          >
            <View className="flex-row items-center justify-between mb-4">
              <View className="flex-row items-center">
                <Ionicons name={category.icon as any} size={24} color="#1a237e" />
                <Text className="text-lg font-semibold text-[#1a237e] ml-2">
                  {category.name}
                </Text>
              </View>
              <Text className="text-slate-500 text-sm">
                {selectedCountInCategory(category)}/{category.interests.length}
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {category.interests.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <TouchableOpacity
                    key={interest}
                    onPress={() => handleToggleInterest(interest)}
                    className={`px-4 py-2 rounded-full border ${
                      isSelected 
                        ? 'bg-indigo-600 border-indigo-500' 
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <Text className={
                      isSelected ? 'text-white' : 'text-slate-600'
                    }>
                      {interest}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        ))}
        
        {selectedInterests.length > 0 && (
          <View className="mt-4 p-5 rounded-xl bg-indigo-50 mb-10">
            <Text className="text-[#1a237e] font-semibold mb-2">Selected Interests</Text>
            <View className="flex-row flex-wrap gap-2">
              {selectedInterests.map(interest => (
                <View 
                  key={interest}
                  className="bg-indigo-100 px-3 py-1 rounded-full"
                >
                  <Text className="text-indigo-800">{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
} 