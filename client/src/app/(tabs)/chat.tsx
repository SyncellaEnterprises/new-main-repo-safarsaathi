import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, Image, RefreshControl, ActivityIndicator, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';
import TabHeader from '@/src/components/shared/TabHeader';
import { SearchBar } from '@/src/components/shared/SearchBar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/src/context/AuthContext';
import axios from 'axios';
import Toast from 'react-native-toast-message';

// Set API URL to your local server (same as in explore.tsx)
const API_URL = 'http://10.0.2.2:5000';

// Default profile image if none provided
const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/400x400?text=No+Profile+Image';

// Match interface from API
interface Match {
  username: string;
  userId: number;
  email: string;
  interests: string;
  matchDate: string;
  bio: string;
  profile_photo?: string | null;
}

// Chat preview interface
interface ChatPreview {
  id: string;
  name: string;
  image: string;
  lastMessage: string;
  last_active: string;
  unreadCount: number;
  type: 'match';
  isOnline: boolean;
  lastMessageType?: 'text' | 'image' | 'audio' | 'document';
  match_data: Match; // Original match data from API
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch matches from API
  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get JWT token
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      // Make API request to get matches
      console.log('Fetching matches...');
      const response = await axios.get(`${API_URL}/api/matches/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Matches response:', response.data);

      if (response.data.matches) {
        setMatches(response.data.matches);
        
        // Transform matches to chat previews
        const chatPreviews = response.data.matches.map((match: Match) => ({
          id: match.userId.toString(),
          name: match.username,
          image: match.profile_photo || DEFAULT_PROFILE_IMAGE,
          lastMessage: "Tap to start chatting!",
          last_active: match.matchDate,
          unreadCount: 0,
          type: 'match' as const,
          isOnline: false,
          match_data: match
        }));
        
        setChats(chatPreviews);
        setError(null);
      } else {
        setMatches([]);
        setChats([]);
        setError('No matches found');
      }
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      setError(error.message || 'Failed to fetch matches');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load matches'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch of matches
  useEffect(() => {
    fetchMatches();
  }, []);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  }, [fetchMatches]);

  // Format date display
  const getTimeDisplay = (timestamp: string) => {
    try {
      const messageDate = new Date(timestamp);
      const today = new Date();
      
      if (messageDate.toDateString() === today.toDateString()) {
        // If message is from today, show time
        return format(messageDate, 'HH:mm');
      } else if (
        messageDate.getDate() === today.getDate() - 1 && 
        messageDate.getMonth() === today.getMonth() && 
        messageDate.getFullYear() === today.getFullYear()
      ) {
        // If message is from yesterday
        return 'Yesterday';
      } else if (today.getTime() - messageDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
        // If message is from this week
        return format(messageDate, 'EEE');
      } else {
        // Otherwise show date
        return format(messageDate, 'dd/MM');
      }
    } catch (e) {
      // If date parsing fails, return a fallback
      return 'New';
    }
  };

  // Render message preview
  const renderMessagePreview = (content: string, type?: string) => {
    if (type === 'image') {
      return (
        <View className="flex-row items-center">
          <Ionicons name="image-outline" size={14} color="#9CA3AF" />
          <Text className="text-neutral-dark ml-1 font-montserrat text-xs">Photo</Text>
        </View>
      );
    } else if (type === 'audio') {
      return (
        <View className="flex-row items-center">
          <Ionicons name="mic-outline" size={14} color="#9CA3AF" />
          <Text className="text-neutral-dark ml-1 font-montserrat text-xs">Voice message</Text>
        </View>
      );
    } else {
      return (
        <Text 
          numberOfLines={1} 
          className={`text-sm font-montserrat ${
            content.includes("@") ? "text-primary" : "text-neutral-dark"
          }`}
        >
          {content}
        </Text>
      );
    }
  };

  // Render chat item
  const renderChatItem = ({ item }: { item: ChatPreview }) => (
    <Animated.View entering={FadeInDown.delay(parseInt(item.id) * 100)}>
      <TouchableOpacity
        onPress={() => router.push(`/chat/${item.id}`)}
        className="flex-row items-center px-4 py-3.5"
        activeOpacity={0.7}
      >
        <View className="relative">
          <Image
            source={{ uri: item.image }}
            className="w-14 h-14 rounded-full"
          />
          {item.isOnline && (
            <View className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full border-2 border-neutral-lightest" />
          )}
          {item.type === 'match' && (
            <View className="absolute -bottom-1 -right-1 bg-primary-light rounded-full w-5 h-5 items-center justify-center border border-neutral-lightest">
              <Ionicons name="heart" size={10} color="#fff" />
            </View>
          )}
        </View>

        <View className="flex-1 ml-3 border-b border-neutral-medium pb-3.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-montserratMedium text-neutral-darkest">
              {item.name}
            </Text>
            <Text className="text-xs text-neutral-dark font-montserrat">
              {getTimeDisplay(item.last_active)}
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-1 mr-3">
              {renderMessagePreview(item.lastMessage, item.lastMessageType)}
            </View>
            
            {item.unreadCount > 0 && (
              <View className="bg-primary rounded-full min-w-5 h-5 items-center justify-center px-1">
                <Text className="text-neutral-lightest text-xs font-montserratBold">
                  {item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  // Empty state component
  const renderEmptyComponent = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Ionicons name="chatbubbles-outline" size={48} color="#E6E4EC" />
      <Text className="text-neutral-dark mt-4 text-center font-montserrat">
        {error || "No matches yet.\nKeep swiping to find connections!"}
      </Text>
      <TouchableOpacity 
        onPress={() => router.push("/(tabs)/explore")}
        className="mt-6 bg-primary px-6 py-3 rounded-xl"
      >
        <Text className="text-white font-montserratMedium">Explore Users</Text>
      </TouchableOpacity>
    </View>
  );

  // Filter chats based on search query
  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (chat.match_data.interests && 
      chat.match_data.interests.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (chat.match_data.bio && 
      chat.match_data.bio.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SafeAreaView className="flex-1 bg-neutral-light">
      <TabHeader
        title="Matches"
        gradientColors={['rgba(125, 91, 166, 0.9)', 'rgba(90, 65, 128, 0.8)']}
      />
      
      {/* Search Bar */}
      <View className="mt-2 mx-4 mb-3">
        <View className="bg-white rounded-xl overflow-hidden shadow">
          <View className="flex-row items-center px-3 py-2">
            <Ionicons name="search" size={20} color="#7D5BA6" />
            <TextInput
              placeholder="Search matches..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-2 text-neutral-darkest font-montserrat"
              onChangeText={setSearchQuery}
              value={searchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7D5BA6" />
          <Text className="mt-4 text-neutral-dark font-montserrat">Loading your matches...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7D5BA6"
              colors={["#7D5BA6"]}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={filteredChats.length === 0 ? { flex: 1 } : undefined}
        />
      )}

      {/* New Chat FAB */}
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/explore")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: "#7D5BA6",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 5
        }}
      >
        <Ionicons name="search" size={24} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
