import { View, Text, SafeAreaView, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState, useCallback, useEffect } from 'react';
import TabHeader from '@/src/components/shared/TabHeader';
import { SearchBar } from '@/src/components/shared/SearchBar';
import { format } from 'date-fns';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { useSocket } from '@/src/context/SocketContext';
import { useAuth } from '@/src/context/AuthContext';

interface ChatPreview {
  id: string;
  userName: string;
  userImage: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  isTyping: boolean;
  lastMessageType: 'text' | 'image' | 'audio' | 'document';
  type: 'group' | 'one-to-one';
}

export default function ChatScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const socket = useSocket();
  const { user } = useAuth();
  const [activeTyping, setActiveTyping] = useState<{ [key: string]: boolean }>({});

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Fetch new chats here
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for new messages
    socket.on('new_message', (message) => {
      setChats(prev => prev.map(chat => {
        if (chat.id === message.sender || chat.id === message.receiver) {
          return {
            ...chat,
            lastMessage: message.content,
            timestamp: message.sent_at,
            unreadCount: chat.unreadCount + 1
          };
        }
        return chat;
      }));
    });

    // Listen for typing indicators
    socket.on('typing', ({ senderId, isTyping }) => {
      setActiveTyping(prev => ({ ...prev, [senderId]: isTyping }));
    });

    return () => {
      socket.off('new_message');
      socket.off('typing');
    };
  }, [socket]);

  const renderLastMessage = (chat: ChatPreview) => {
    switch (chat.lastMessageType) {
      case 'image':
        return (
          <View className="flex-row items-center">
            <Ionicons name="image-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 ml-1">Photo</Text>
          </View>
        );
      case 'audio':
        return (
          <View className="flex-row items-center">
            <Ionicons name="mic-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 ml-1">Voice message</Text>
          </View>
        );
      case 'document':
        return (
          <View className="flex-row items-center">
            <Ionicons name="document-outline" size={16} color="#6B7280" />
            <Text className="text-gray-500 ml-1">Document</Text>
          </View>
        );
      default:
        return (
          <Text 
            numberOfLines={1} 
            className={`text-sm ${chat.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`}
          >
            {chat.lastMessage}
          </Text>
        );
    }
  };

  const renderChatItem = ({ item: chat }: { item: ChatPreview }) => (
    <TouchableOpacity
      onPress={() => router.push(`/chat/${chat.id}`)} // Navigate to chat screen
      className="flex-row items-center px-4 py-3 bg-white"
    >
      <View className="relative">
        <Image
          source={{ uri: chat.userImage }}
          className="w-14 h-14 rounded-full"
        />
        {chat.isOnline && (
          <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
        )}
      </View>

      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg font-semibold text-gray-800">
            {chat.userName}
          </Text>
          <Text className="text-xs text-gray-500">
            {format(new Date(chat.timestamp), 'HH:mm')}
          </Text>
        </View>

        <View className="flex-row items-center justify-between mt-1">
          <View className="flex-1 flex-row items-center">
            {activeTyping[chat.id] ? (
              <Text className="text-blue-500 text-sm">typing...</Text>
            ) : (
              renderLastMessage(chat)
            )}
          </View>

          {chat.unreadCount > 0 && (
            <View className="bg-blue-500 rounded-full min-w-[20px] h-5 items-center justify-center px-1">
              <Text className="text-xs text-white font-medium">
                {chat.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View className="px-4 py-2 bg-gray-50">
      <Text className="text-sm font-medium text-gray-500">{section.title}</Text>
    </View>
  );

  const renderEmptyComponent = () => (
    <View className="flex-1 items-center justify-center py-20">
      <Ionicons name="chatbubbles-outline" size={48} color="#9CA3AF" />
      <Text className="text-gray-500 mt-4 text-center">
        No conversations yet{'\n'}Start chatting with someone!
      </Text>
    </View>
  );

  const filteredChats = chats.filter(chat => 
    chat.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <LinearGradient
        colors={['#3B82F6', '#60A5FA', '#93C5FD']}
        className="flex-1 px-md"
      >
        <TabHeader
          title="Messages"
          leftIcon="mail-unread-outline"
          rightIcon="filter-outline"
          onLeftPress={() => router.push("/chat/requests")}
          onRightPress={() => router.push("/chat/filter")}
          gradientColors={['#3B82F6', '#60A5FA']}
        />

        <View className="px-4 py-2">
          <SearchBar
            value={searchQuery}
            onSearch={setSearchQuery}
            placeholder="Search messages..."
          />
        </View>

        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          ItemSeparatorComponent={() => (
            <View className="h-[1px] bg-gray-100 ml-[76px]" />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#1a237e"
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={
            filteredChats.length === 0 ? { flex: 1 } : undefined
          }
        />

        {/* New Chat FAB */}
        <TouchableOpacity
          onPress={() => router.push("/chat/new-message")}
          className="absolute bottom-6 right-6 w-14 h-14 bg-blue-500 rounded-full items-center justify-center shadow-lg"
          style={{
            shadowColor: '#1a237e',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 8
          }}
        >
          <Ionicons name="create" size={24} color="white" />
        </TouchableOpacity>
      </LinearGradient>
    </SafeAreaView>
  );
}
