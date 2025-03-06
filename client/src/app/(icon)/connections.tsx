import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import Animated, { FadeInDown } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width * 0.8;

// Mock Data
const mockConnections: Connection[] = [
  {
    id: '1',
    name: 'Sarah',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330',
    lastActive: '2024-03-10T15:30:00Z',
    isOnline: true,
    matchDate: '2024-03-08T10:00:00Z',
    compatibility: 95,
    mutualInterests: ['Photography', 'Travel', 'Cooking'],
    bio: 'Adventure seeker & coffee lover ☕',
  },
  {
    id: '2',
    name: 'Emily',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
    lastActive: '2024-03-10T14:20:00Z',
    isOnline: false,
    matchDate: '2024-03-07T15:30:00Z',
    compatibility: 88,
    mutualInterests: ['Yoga', 'Reading', 'Art'],
    bio: 'Life is beautiful 🌸',
  },
  {
    id: '3',
    name: 'Jessica',
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1',
    lastActive: '2024-03-10T16:00:00Z',
    isOnline: true,
    matchDate: '2024-03-06T09:15:00Z',
    compatibility: 92,
    mutualInterests: ['Music', 'Dancing', 'Fashion'],
    bio: 'Music is life 🎵',
  },
  // Add more mock data as needed
];

interface Connection {
  id: string;
  name: string;
  image: string;
  lastActive: string;
  isOnline: boolean;
  matchDate: string;
  compatibility: number;
  mutualInterests: string[];
  bio: string;
}

export default function Connections() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'matches' | 'connections'>('matches');
  const [connections, setConnections] = useState<Connection[]>(mockConnections);

  const renderMatchCard = ({ item }: { item: Connection }) => (
    <Animated.View 
      entering={FadeInDown.delay(200)}
      className="mr-4"
      style={{ width: CARD_WIDTH }}
    >
      <BlurView intensity={30} className="rounded-3xl overflow-hidden">
        <Image 
          source={{ uri: item.image }}
          className="w-full h-[400px]"
          style={{ opacity: 0.9 }}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          className="absolute bottom-0 w-full p-6"
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <Text className="text-white text-2xl font-bold">{item.name}</Text>
              {item.isOnline && (
                <View className="w-3 h-3 bg-emerald-500 rounded-full ml-2" />
              )}
            </View>
            <View className="bg-white/20 px-3 py-1 rounded-full">
              <Text className="text-white font-semibold">{item.compatibility}% Match</Text>
            </View>
          </View>

          <Text className="text-white/80 text-lg mb-4">{item.bio}</Text>

          <View className="flex-row flex-wrap gap-2">
            {item.mutualInterests.map((interest, index) => (
              <View 
                key={index}
                className="bg-white/10 px-4 py-2 rounded-full"
              >
                <Text className="text-white">{interest}</Text>
              </View>
            ))}
          </View>

          <View className="flex-row justify-between mt-6">
            <TouchableOpacity className="bg-white/20 p-4 rounded-2xl flex-1 mr-3">
              <Text className="text-white text-center font-semibold">Message</Text>
            </TouchableOpacity>
            <TouchableOpacity className="bg-indigo-500 p-4 rounded-2xl flex-1">
              <Text className="text-white text-center font-semibold">View Profile</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );

  const renderConnectionCard = ({ item }: { item: Connection }) => (
    <TouchableOpacity 
      onPress={() => router.push(`/chat/${item.id}`)}
      className="p-4 bg-white"
    >
      <View className="flex-row">
        <View className="relative">
          <Image 
            source={{ uri: item.image }}
            className="w-20 h-20 rounded-2xl"
          />
          {item.isOnline && (
            <View className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
          )}
        </View>

        <View className="flex-1 ml-4 justify-center">
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-800">{item.name}</Text>
            <View className="bg-rose-50 px-3 py-1 rounded-full flex-row items-center">
              <Ionicons name="heart" size={16} color="#FF4B4B" />
              <Text className="text-rose-500 font-medium ml-1">{item.compatibility}%</Text>
            </View>
          </View>

          <Text className="text-gray-500 mt-1 mb-2">{item.bio}</Text>

          <View className="flex-row flex-wrap gap-2">
            {item.mutualInterests.map((interest, index) => (
              <View key={index} className="bg-indigo-50 px-3 py-1 rounded-full">
                <Text className="text-indigo-600 text-sm">{interest}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#4F46E5', '#7C3AED']}
        className="px-4 py-3 rounded-b-3xl"
      >
      
        <Text className="text-2xl font-bold text-gray-800">Connections</Text>
        
        {/* Tab Switcher */}
        <View className="flex-row mt-4 bg-gray-100 rounded-full p-1">
          {['matches', 'connections'].map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab as 'matches' | 'connections')}
              className={`flex-1 py-2 rounded-full ${
                activeTab === tab ? 'bg-white' : ''
              }`}
            >
              <Text 
                className={`text-center ${
                  activeTab === tab ? 'text-blue-500' : 'text-gray-500'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {activeTab === 'matches' ? (
        <ScrollView 
          horizontal 
          className="px-4 py-6"
          showsHorizontalScrollIndicator={false}
        >
          {connections.length > 0 ? (
            connections.map(connection => (
              <View key={connection.id}>
                {renderMatchCard({ item: connection })}
              </View>
            ))
          ) : (
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-16 h-16 bg-indigo-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="heart-outline" size={32} color="#4F46E5" />
              </View>
              <Text className="text-gray-500 text-center">
                No matches yet{'\n'}Keep swiping!
              </Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <FlatList
          data={connections}
          renderItem={renderConnectionCard}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => (
            <View className="h-4" />
          )}
          ListEmptyComponent={() => (
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-16 h-16 bg-indigo-100 rounded-full items-center justify-center mb-4">
                <Ionicons name="people-outline" size={32} color="#4F46E5" />
              </View>
              <Text className="text-gray-500 text-center">
                No connections yet{'\n'}Start matching!
              </Text>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}