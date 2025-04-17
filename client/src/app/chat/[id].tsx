import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSocket } from '@/src/context/SocketContext';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn } from 'react-native-reanimated';

interface Message {
  message_id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  sent_at: string;
  type: 'text' | 'image' | 'video';
  status: 'sent' | 'delivered' | 'read';
}

interface Recipient {
  id: string;
  username: string;
  profile_photo: string | null;
  isOnline: boolean;
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const { socket, isConnected, isConnecting, joinChat, sendMessage, readMessage, sendTypingStatus } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recipient, setRecipient] = useState<Recipient>({ 
    id: String(id), 
    username: 'Loading...', 
    profile_photo: null,
    isOnline: false 
  });
  const [isLoading, setIsLoading] = useState(true);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Join the chat when connected
  useEffect(() => {
    if (isConnected && id) {
      joinChat(String(id));
    }
  }, [isConnected, id, joinChat]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // Handler for when successfully joined a chat
    const handleChatJoined = (data: {
      room_id: string;
      recipient: Recipient;
      is_online: boolean;
      messages: Message[];
    }) => {
      console.log('Chat joined with data:', JSON.stringify(data));
      
      // Validate recipient data
      const recipientData = data.recipient || { 
        id: String(id), 
        username: 'User', 
        profile_photo: null,
        isOnline: false 
      };
      
      // Validate messages array
      const validMessages = Array.isArray(data.messages) 
        ? data.messages.filter(msg => msg && typeof msg === 'object')
        : [];
      
      console.log(`Received ${validMessages.length} valid messages`);
      
      setRecipient({
        ...recipientData,
        isOnline: data.is_online
      });
      setMessages(validMessages);
      setIsLoading(false);
    };

    // Handler for new messages
    const handleNewMessage = (message: Message) => {
      console.log('New message received:', JSON.stringify(message));
      
      // Validate the message object
      if (!message || typeof message !== 'object') {
        console.warn('Received invalid message object');
        return;
      }
      
      setMessages(prev => [...prev, message]);
      
      // If the message is from the other user, mark it as read
      if (message.sender_id === String(id)) {
        readMessage(message.message_id);
      }
    };

    // Handler for message status updates
    const handleMessageStatus = (data: { message_id: string; status: string }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.message_id === data.message_id 
            ? { ...msg, status: data.status as 'sent' | 'delivered' | 'read' } 
            : msg
        )
      );
    };

    // Handler for typing status
    const handleTypingStatus = (data: { user_id: string; is_typing: boolean }) => {
      if (data.user_id === String(id)) {
        setIsTyping(data.is_typing);
      }
    };

    // Handler for user status
    const handleUserStatus = (data: { user_id: string; status: 'online' | 'offline' }) => {
      if (data.user_id === String(id)) {
        setRecipient(prev => ({
          ...prev,
          isOnline: data.status === 'online'
        }));
      }
    };

    // Set up event listeners
    socket.on('chat_joined', handleChatJoined);
    socket.on('new_message', handleNewMessage);
    socket.on('message_status', handleMessageStatus);
    socket.on('typing_status', handleTypingStatus);
    socket.on('user_status', handleUserStatus);

    // Clean up event listeners
    return () => {
      socket.off('chat_joined', handleChatJoined);
      socket.off('new_message', handleNewMessage);
      socket.off('message_status', handleMessageStatus);
      socket.off('typing_status', handleTypingStatus);
      socket.off('user_status', handleUserStatus);
    };
  }, [socket, id, readMessage, user]);

  // Handle sending a message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;

    sendMessage(newMessage.trim(), String(id));
    setNewMessage('');
    
    // Cancel typing indicator when sending
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
      sendTypingStatus(String(id), false);
    }
  };

  // Handle typing indicators
  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    // Send typing indicator when user starts typing
    if (!typingTimerRef.current && text.length > 0) {
      sendTypingStatus(String(id), true);
    }
    
    // Clear previous timer
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    
    // Set a new timer to stop typing indicator after 3 seconds of inactivity
    typingTimerRef.current = setTimeout(() => {
      sendTypingStatus(String(id), false);
      typingTimerRef.current = null;
    }, 3000);
  };

  // Format date for display
  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Return current time if date is invalid
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Render message items
  const renderMessage = ({ item }: { item: Message }) => {
    if (!item || !user) return null;
    
    const senderId = String(item.sender_id || '');
    const userId = String(user.id || '');
    const isOwnMessage = senderId === userId;
    
    return (
      <Animated.View 
        entering={FadeIn}
        className={`flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 px-4`}
      >
        {!isOwnMessage && (
          <Image
            source={{ uri: recipient.profile_photo || 'https://via.placeholder.com/400x400?text=No+Profile+Image' }}
            className="h-8 w-8 rounded-full mr-2 mt-1"
          />
        )}
        <View className={`max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <View 
            className={`rounded-2xl px-4 py-2.5 shadow-sm ${
              isOwnMessage 
                ? 'rounded-tr-sm bg-gradient-romance ml-auto' 
                : 'rounded-tl-sm bg-white mr-auto'
            }`}
          >
            {!isOwnMessage && (
              <Text className="text-primary-dark text-xs font-montserratMedium mb-1">
                {item.sender_name}
              </Text>
            )}
            <Text className={`${isOwnMessage ? 'text-white' : 'text-neutral-darkest'} font-montserrat`}>
              {item.content || ''}
            </Text>
          </View>
          <View className={`flex-row items-center mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <Text className="text-xs text-neutral-dark font-montserrat">
              {formatMessageTime(item.sent_at || new Date().toISOString())}
            </Text>
            {isOwnMessage && (
              <View className="flex-row ml-1">
                {item.status === 'sent' && (
                  <Ionicons name="checkmark" size={14} color="#9CA3AF" />
                )}
                {item.status === 'delivered' && (
                  <Ionicons name="checkmark-done" size={14} color="#9CA3AF" />
                )}
                {item.status === 'read' && (
                  <Ionicons name="checkmark-done" size={14} color="#3D90E3" />
                )}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  // Empty state for no messages
  const renderEmptyMessages = () => (
    <View className="flex-1 items-center justify-center p-8">
      <LinearGradient
        colors={['rgba(255,77,109,0.1)', 'rgba(61,144,227,0.1)']}
        className="w-20 h-20 rounded-full items-center justify-center mb-4"
      >
        <Ionicons name="chatbubbles-outline" size={40} color="#FF4D6D" />
      </LinearGradient>
      <Text className="text-lg text-center text-neutral-darkest font-youngSerif mb-2">
        Start the Conversation
      </Text>
      <Text className="text-center text-neutral-dark font-montserrat">
        Say hello and begin your journey together!
      </Text>
    </View>
  );

  // Show loading state
  if (isConnecting || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-light">
        <ActivityIndicator size="large" color="#7D5BA6" />
        <Text className="mt-4 text-center text-neutral-dark font-montserrat">
          Connecting to chat...
        </Text>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-light">
        <Ionicons name="wifi-outline" size={64} color="#E6E4EC" />
        <Text className="mt-4 text-center text-neutral-dark font-montserrat">
          Connection lost. Reconnecting...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-neutral-light">
      {/* Header */}
      <LinearGradient
        colors={['#FF4D6D', '#FF758F']}
        className="px-4 py-3"
      >
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-3 p-1"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push({
              pathname: '/(tabs)/profile',
              params: { id: recipient.id }
            })}
            className="flex-row items-center flex-1"
          >
            <View className="relative">
              <Image
                source={{ uri: recipient.profile_photo || 'https://via.placeholder.com/400x400?text=No+Profile+Image' }}
                className="h-10 w-10 rounded-full border-2 border-white/30"
              />
              {recipient.isOnline && (
                <View className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full border-2 border-white" />
              )}
            </View>
            
            <View className="flex-1 ml-3">
              <Text className="text-white text-lg font-montserratBold">
                {recipient.username}
              </Text>
              <Text className="text-white/80 text-sm font-montserrat">
                {recipient.isOnline ? (isTyping ? 'typing...' : 'Online') : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>

          <View className="flex-row">
            <TouchableOpacity className="p-2">
              <Ionicons name="videocam" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2">
              <Ionicons name="call" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2">
              <Ionicons name="ellipsis-vertical" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.message_id}
        contentContainerStyle={[
          messages.length === 0 ? { flex: 1 } : { paddingVertical: 16 },
          { paddingBottom: 80 }
        ]}
        ListEmptyComponent={renderEmptyMessages}
        inverted={false}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      />

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="border-t border-neutral-medium/20 bg-neutral-lightest"
      >
        <View className="flex-row items-end p-2">
          <View className="flex-row items-end flex-1 bg-white rounded-2xl px-4 py-2 mr-2 shadow-sm">
            <TextInput
              value={newMessage}
              onChangeText={handleTyping}
              placeholder="Message..."
              className="flex-1 max-h-24 text-base text-neutral-darkest font-montserrat"
              multiline
              maxLength={500}
            />
            
            <View className="flex-row items-center">
              <TouchableOpacity className="p-2">
                <Ionicons name="happy-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity className="p-2">
                <Ionicons name="camera-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity className="p-2">
                <Ionicons name="mic-outline" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || !isConnected}
            className={`p-2 rounded-full ${
              newMessage.trim() ? 'bg-gradient-romance' : 'bg-neutral-medium'
            } h-12 w-12 items-center justify-center shadow-sm`}
          >
            <Ionicons 
              name={newMessage.trim() ? "send" : "mic"} 
              size={20} 
              color="white"
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
