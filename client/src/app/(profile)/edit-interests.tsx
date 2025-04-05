import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
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
    id: '1',
    name: 'Activities',
    icon: 'bicycle',
    interests: ['Hiking', 'Swimming', 'Cycling', 'Running', 'Yoga', 'Camping', 'Surfing', 'Skiing']
  },
  {
    id: '2',
    name: 'Arts & Culture',
    icon: 'color-palette',
    interests: ['Museums', 'Theater', 'Music', 'Movies', 'Dancing', 'Photography', 'Painting', 'Reading']
  },
  {
    id: '3',
    name: 'Food & Drink',
    icon: 'restaurant',
    interests: ['Cooking', 'Baking', 'Wine Tasting', 'Craft Beer', 'Foodie', 'Vegan', 'BBQ', 'Sushi']
  },
  {
    id: '4',
    name: 'Travel',
    icon: 'airplane',
    interests: ['Beach', 'Mountains', 'Cities', 'Road Trips', 'Backpacking', 'Luxury Travel', 'Solo Travel', 'Adventure']
  }
];

export default function EditInterestsScreen() {
  const router = useRouter();
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const MAX_INTERESTS = 10;

  useEffect(() => {
    fetchUserInterests();
  }, []);

  const fetchUserInterests = async () => {
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
          // Handle interests from the API
          const interests = data.user.interest || [];
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
    setSelectedInterests(prev => {
      const isSelected = prev.includes(interest);
      const updatedInterests = isSelected
        ? prev.filter(i => i !== interest)
        : [...prev, interest];
      
      setHasChanges(true);
      return updatedInterests;
    });
  };

  const handleSave = async () => {
    if (!hasChanges) {
      Alert.alert('No Changes', 'No changes were made to your interests');
      return;
    }
    
    if (selectedInterests.length === 0) {
      Alert.alert('No Interests', 'Please select at least one interest');
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
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Helper functions for the UI
  const isCategorySelected = (category: InterestCategory) => {
    return category.interests.some(interest => selectedInterests.includes(interest));
  };
  
  const selectedCountInCategory = (category: InterestCategory) => {
    return category.interests.filter(interest => selectedInterests.includes(interest)).length;
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-neutral-light justify-center items-center">
        <ActivityIndicator size="large" color="#7D5BA6" />
        <Text className="mt-4 text-primary font-montserrat">Loading interests...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-light">
      <Animated.View 
        entering={FadeInDown.duration(500)}
        className="bg-neutral-lightest px-6 pt-6 pb-4 border-b border-neutral-medium"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#7D5BA6" />
            <Text className="ml-2 text-primary font-montserratMedium">Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-youngSerif text-primary-dark">Interests</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#7D5BA6" />
            ) : (
              <Text className={`font-montserratMedium ${hasChanges ? 'text-primary' : 'text-neutral-dark/40'}`}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-2xl font-youngSerif text-primary-dark mb-2">
          Your Interests
        </Text>
        <Text className="text-neutral-dark mb-6 font-montserrat">
          Select up to {MAX_INTERESTS} interests. Selected: {selectedInterests.length}/{MAX_INTERESTS}
        </Text>

        {INTEREST_CATEGORIES.map((category, catIndex) => (
          <Animated.View
            key={category.id}
            entering={FadeIn.delay(catIndex * 100)}
            className="mb-6"
          >
            <View className="flex-row items-center mb-3">
              <Ionicons name={category.icon as any} size={24} color="#7D5BA6" />
              <View className="flex-1 ml-2">
                <Text className="text-lg font-montserratMedium text-primary-dark">
                  {category.name}
                </Text>
                {isCategorySelected(category) && (
                  <Text className="text-primary font-montserrat text-xs">
                    {selectedCountInCategory(category)} selected
                  </Text>
                )}
              </View>
            </View>
            
            <View className="flex-row flex-wrap">
              {category.interests.map((interest, index) => {
                const isSelected = selectedInterests.includes(interest);
                const isMaxedOut = selectedInterests.length >= MAX_INTERESTS && !isSelected;
                
                return (
                  <TouchableOpacity
                    key={`${category.id}-${index}`}
                    onPress={() => handleToggleInterest(interest)}
                    disabled={isMaxedOut}
                    className={`mr-2 mb-2 px-4 py-2 rounded-full border ${
                      isSelected 
                        ? 'bg-primary border-primary' 
                        : isMaxedOut
                          ? 'bg-neutral-medium border-neutral-medium'
                          : 'bg-neutral-lightest border-neutral-medium'
                    }`}
                  >
                    <Text className={`${
                      isSelected 
                        ? 'text-neutral-lightest font-montserratMedium' 
                        : isMaxedOut
                          ? 'text-neutral-dark/40 font-montserrat'
                          : 'text-neutral-dark font-montserrat'
                    }`}>
                      {interest}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        ))}

        <View className="h-20" />
      </ScrollView>
    </View>
  );
} 