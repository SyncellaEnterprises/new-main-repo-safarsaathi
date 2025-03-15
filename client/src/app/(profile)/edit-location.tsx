import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, SlideInRight, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";

interface Location {
  id: string;
  district: string;
  state: string;
  talukas: string[];
}

// Mock locations data - replace with API call
const LOCATIONS: Location[] = [
  {
    id: '1',
    district: 'Mumbai City',
    state: 'Maharashtra',
    talukas: ['Andheri', 'Borivali', 'Bandra', 'Dadar']
  },
  {
    id: '2',
    district: 'Pune',
    state: 'Maharashtra',
    talukas: ['Haveli', 'Mulshi', 'Maval']
  },
  // Add more districts...
];

export default function EditLocationScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<Location | null>(null);
  const [selectedTaluka, setSelectedTaluka] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filteredLocations, setFilteredLocations] = useState(LOCATIONS);

  useEffect(() => {
    if (searchQuery) {
      const filtered = LOCATIONS.filter(location =>
        location.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
        location.state.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(LOCATIONS);
    }
  }, [searchQuery]);

  const handleSave = () => {
    if (selectedDistrict && selectedTaluka) {
      // Save logic here
      router.back();
    }
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
          <Text className="text-lg font-semibold text-[#1a237e]">Location</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={!selectedDistrict || !selectedTaluka}
          >
            <Text className={`font-semibold ${
              selectedDistrict && selectedTaluka 
                ? 'text-[#1a237e]' 
                : 'text-slate-300'
            }`}>
              Save
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-2xl font-bold text-[#1a237e] mb-2">
          Select Your Location
        </Text>
        <Text className="text-slate-500 mb-6">
          Choose your district and taluka for better local connections
        </Text>

        <Animated.View 
          entering={SlideInRight.delay(100)}
          className="mb-6"
        >
          <View className="relative">
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search districts..."
              className="bg-white rounded-xl px-4 py-3 pl-12 border-2 border-slate-200 focus:border-[#1a237e]"
            />
            <View className="absolute left-4 top-3.5">
              <Ionicons name="search-outline" size={20} color="#94a3b8" />
            </View>
          </View>
        </Animated.View>

        <View className="space-y-4">
          {filteredLocations.map((location, index) => (
            <Animated.View
              key={location.id}
              entering={FadeIn.delay(index * 100)}
            >
              <TouchableOpacity
                onPress={() => setSelectedDistrict(location)}
                className={`p-4 rounded-xl ${
                  selectedDistrict?.id === location.id
                    ? 'bg-indigo-50 border-2 border-[#1a237e]'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className={`font-semibold ${
                      selectedDistrict?.id === location.id
                        ? 'text-[#1a237e]'
                        : 'text-slate-800'
                    }`}>
                      {location.district}
                    </Text>
                    <Text className="text-slate-500">{location.state}</Text>
                  </View>
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={selectedDistrict?.id === location.id ? "#1a237e" : "#94a3b8"} 
                  />
                </View>
              </TouchableOpacity>

              {selectedDistrict?.id === location.id && (
                <Animated.View 
                  entering={SlideInRight}
                  className="mt-2 ml-4"
                >
                  <View className="border-l-2 border-[#1a237e] pl-4 space-y-2">
                    {location.talukas.map((taluka) => (
                      <TouchableOpacity
                        key={taluka}
                        onPress={() => setSelectedTaluka(taluka)}
                        className={`p-3 rounded-xl ${
                          selectedTaluka === taluka
                            ? 'bg-indigo-50'
                            : 'bg-white border border-slate-100'
                        }`}
                      >
                        <Text className={
                          selectedTaluka === taluka
                            ? 'text-[#1a237e]'
                            : 'text-slate-600'
                        }>
                          {taluka}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          ))}
        </View>

        <TouchableOpacity className="mt-6 flex-row items-center bg-indigo-50 p-4 rounded-xl">
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