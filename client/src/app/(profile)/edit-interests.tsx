import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

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
  const MAX_INTERESTS = 8;

  const handleToggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(prev => prev.filter(i => i !== interest));
    } else if (selectedInterests.length < MAX_INTERESTS) {
      setSelectedInterests(prev => [...prev, interest]);
    }
  };

  const handleSave = () => {
    // Implement the save logic
  };

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
          <TouchableOpacity onPress={handleSave}>
            <Text className="text-[#1a237e] font-semibold">Save</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-2xl font-bold text-[#1a237e] mb-2">
          Your Interests
        </Text>
        <Text className="text-slate-500 mb-6">
          Select up to {MAX_INTERESTS} interests to help us find better matches
        </Text>

        {INTEREST_CATEGORIES.map((category, index) => (
          <Animated.View
            key={category.id}
            entering={FadeIn.delay(index * 100)}
            className="mb-8"
          >
            <View className="flex-row items-center mb-4">
              <Ionicons name={category.icon as any} size={24} color="#1a237e" />
              <Text className="text-lg font-semibold text-[#1a237e] ml-2">
                {category.name}
              </Text>
            </View>

            <View className="flex-row flex-wrap gap-2">
              {category.interests.map((interest) => {
                const isSelected = selectedInterests.includes(interest);
                return (
                  <TouchableOpacity
                    key={interest}
                    onPress={() => handleToggleInterest(interest)}
                    className={`px-4 py-2 rounded-full border-2 ${
                      isSelected 
                        ? 'bg-indigo-50 border-[#1a237e]' 
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <Text className={
                      isSelected ? 'text-[#1a237e]' : 'text-slate-600'
                    }>
                      {interest}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
} 