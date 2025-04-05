import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, Image, RefreshControl, ActivityIndicator } from 'react-native';
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

// Mock data for demonstration
const MOCK_CHATS = [
  {
    id: '1',
    name: 'Sarah Johnson',
    image: 'https://randomuser.me/api/portraits/women/43.jpg',
    lastMessage: 'Looking forward to our trip! 🏔️',
    last_active: new Date().toISOString(),
    unreadCount: 3,
    type: 'private' as const,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Travel Buddies',
    image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    lastMessage: "Rahul: I'll bring the snacks for the hike",
    last_active: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    unreadCount: 0,
    type: 'group' as const,
    isOnline: false,
  },
  {
    id: '3',
    name: 'Alex Chen',
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    lastMessage: 'The homestay near the lake looks amazing!',
    last_active: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    unreadCount: 0,
    type: 'private' as const,
    isOnline: true,
  },
  {
    id: '4',
    name: 'Mumbai Explorers',
    image: 'https://images.unsplash.com/photo-1529253355930-ddbe423a2ac7?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60',
    lastMessage: 'Meeting at Gateway of India at 5pm',
    last_active: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    unreadCount: 2,
    type: 'group' as const,
    isOnline: false,
  },
  {
    id: '5',
    name: 'Priya Patel',
    image: 'https://randomuser.me/api/portraits/women/64.jpg',
    lastMessage: 'Got our train tickets! ✓',
    last_active: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    unreadCount: 0,
    type: 'private' as const,
    isOnline: false,
  }
];

interface ChatPreview {
  id: string;
  name: string;
  image: string;
  lastMessage: string;
  last_active: string;
  unreadCount: number;
  type: 'group' | 'private';
  isOnline: boolean;
  lastMessageType?: 'text' | 'image' | 'audio' | 'document';
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [chats, setChats] = useState<ChatPreview[]>(MOCK_CHATS);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // In a real app, fetch chats from API here
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);

  // Example function to get time display
  const getTimeDisplay = (timestamp: string) => {
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
  };

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
          {item.type === 'group' && (
            <View className="absolute -bottom-1 -right-1 bg-primary-light rounded-full w-5 h-5 items-center justify-center border border-neutral-lightest">
              <Ionicons name="people" size={10} color="#fff" />
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

  const renderEmptyComponent = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Ionicons name="chatbubbles-outline" size={48} color="#E6E4EC" />
      <Text className="text-neutral-dark mt-4 text-center font-montserrat">
        No conversations yet{'\n'}Start chatting with someone!
      </Text>
    </View>
  );

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-neutral-light">
      <TabHeader
        title="Messages"
        // leftIcon="mail-unread-outline"
        // rightIcon="filter-outline"
        // onLeftPress={() => router.push("/chat/requests")}
        // onRightPress={() => router.push("/chat/filter")}
        gradientColors={['rgba(125, 91, 166, 0.9)', 'rgba(90, 65, 128, 0.8)']}
      />

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7D5BA6" />
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
        onPress={() => router.push("/chat/new-message")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: '#5A4180',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 8
        }}
      >
        <Ionicons name="create-outline" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
