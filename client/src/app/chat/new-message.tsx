import { useState } from "react";
import { View, TextInput, TouchableOpacity, FlatList, Text, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Match {
  id: string;
  username: string;
  image: string;
}

export default function NewMessage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch(`http://10.0.2.2:5000/api/matches?query=${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      setMatches(data);
    } catch (error) {
      console.error('Failed to fetch matches:', error);
      setMatches([]);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#3B82F6', '#60A5FA', '#93C5FD']}
        className="w-full pt-12 pb-4 px-4"
      >
        <View className="flex-row items-center bg-white rounded-full px-4 py-2">
          <Ionicons name="search" size={20} color="#6B7280" />
          <TextInput
            placeholder="Search for conversations..."
            value={searchQuery}
            onChangeText={handleSearch}
            className="flex-1 ml-2 text-base text-gray-800"
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity>
            <Ionicons name="send" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        className="flex-1"
        contentContainerStyle={{ padding: 12 }}
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity 
            className="flex-row items-center bg-white p-4 rounded-xl mb-2 shadow-sm"
            onPress={() => router.push(`/chat/${item.id}`)}
          >
            <Image
              source={{ uri: item.image }}
              className="h-12 w-12 rounded-full"
            />
            <View className="ml-4 flex-1">
              <Text className="text-gray-800 font-semibold text-lg">
                {item.username}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#6B7280" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-8">
            <Text className="text-gray-500 text-center">
              {searchQuery ? "No matches found" : "Search for conversations"}
            </Text>
          </View>
        }
      />
    </View>
  );
}
