import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useSocket } from '@/src/context/SocketContext';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { 
  FadeIn, 
  SlideInRight, 
  SlideInLeft,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Layout
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import * as ImagePicker from 'expo-image-picker';
import { FlashList } from '@shopify/flash-list';
import { formatDistanceToNow } from 'date-fns';

const { width, height } = Dimensions.get('window');

interface Message {
  message_id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  sent_at: string;
  type: 'text' | 'image' | 'video';
  status: 'sent' | 'delivered' | 'read';
  expires_at?: string; // For ephemeral messages
}

interface Recipient {
  id: string;
  username: string;
  profile_photo: string | null;
  isOnline: boolean;
}

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { socket, isConnected, isConnecting, joinChat, sendMessage, readMessage, sendTypingStatus } = useSocket();
  const { user } = useAuth();
  const router = useRouter();
  
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
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Animated values for modern UI
  const headerHeight = useSharedValue(60);
  const inputHeight = useSharedValue(50);

  const headerStyle = useAnimatedStyle(() => ({
    height: headerHeight.value
  }));

  const inputStyle = useAnimatedStyle(() => ({
    height: inputHeight.value
  }));

  // Handle camera/image picker
  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        // Handle the captured image
        console.log('Image captured:', result.assets[0].uri);
        // Here you would typically upload the image and send it in chat
        // sendMessage(result.assets[0].uri, String(id), 'image');
      }
    } catch (error) {
      console.error('Error picking image:', error);
    }
  };

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

  // Render message items with Snapchat-style bubbles
  const renderMessage = ({ item: message }) => {
    const isOwnMessage = message.sender_id === user?.id;
    const MessageContainer = isOwnMessage ? Animated.View : Animated.View;
    const enteringAnimation = isOwnMessage ? SlideInRight : SlideInLeft;

    return (
      <MessageContainer
        entering={enteringAnimation.delay(100)}
        layout={Layout.springify()}
        className={`flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        {!isOwnMessage && (
          <Image
            source={{ uri: recipient.profile_photo || 'https://via.placeholder.com/400x400?text=No+Profile+Image' }}
            className="w-8 h-8 rounded-full mr-2"
            contentFit="cover"
          />
        )}
        <View
          className={`max-w-[80%] ${
            isOwnMessage ? 'bg-[#45B7D1]' : 'bg-neutral-100'
          } rounded-2xl px-4 py-3`}
        >
          {message.type === 'text' ? (
            <Text
              className={`${
                isOwnMessage ? 'text-white' : 'text-neutral-800'
              } text-base`}
            >
              {message.content}
            </Text>
          ) : (
            <Image
              source={{ uri: message.content }}
              className="w-48 h-48 rounded-lg"
              contentFit="cover"
            />
          )}
          <Text
            className={`text-xs ${
              isOwnMessage ? 'text-white/70' : 'text-neutral-500'
            } mt-1`}
          >
            {formatDistanceToNow(new Date(message.sent_at), { addSuffix: true })}
          </Text>
        </View>
      </MessageContainer>
    );
  };

  // Show loading state
  if (isConnecting || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#45B7D1" />
        <Animated.Text
          entering={FadeInDown.delay(300)}
          className="mt-4 text-neutral-600"
        >
          Loading conversation...
        </Animated.Text>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Ionicons name="wifi" size={64} color="#FF6B6B" />
        <Animated.Text
          entering={FadeInDown.delay(300)}
          className="mt-4 text-neutral-600"
        >
          Connection lost. Reconnecting...
        </Animated.Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <Stack.Screen
        options={{
          headerShown: false
        }}
      />
      
      {/* Custom Header */}
      <Animated.View
        style={headerStyle}
        className="bg-white border-b border-neutral-100"
      >
        <View className="flex-row items-center justify-between px-4 h-full">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2"
          >
            <Ionicons name="arrow-back" size={24} color="#45B7D1" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`/profile/${recipient.id}`)}
            className="flex-row items-center"
          >
            <Image
              source={{ uri: recipient.profile_photo || 'https://via.placeholder.com/400x400?text=No+Profile+Image' }}
              className="w-10 h-10 rounded-full"
              contentFit="cover"
            />
            <View className="ml-3">
              <Text className="font-medium text-neutral-800">
                {recipient.username}
              </Text>
              <Text className="text-sm text-neutral-500">
                {recipient.isOnline ? (isTyping ? 'typing...' : 'Online') : 'Offline'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push(`/chat/${id}/info`)}
            className="p-2"
          >
            <Ionicons name="information-circle-outline" size={24} color="#45B7D1" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Messages List */}
      <FlashList
        ref={listRef}
        data={messages}
        renderItem={renderMessage}
        estimatedItemSize={100}
        inverted
        className="flex-1 px-4"
        onEndReached={() => {}}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading ? (
            <View className="py-4">
              <ActivityIndicator size="small" color="#45B7D1" />
            </View>
          ) : null
        }
      />

      {/* Input Area */}
      <Animated.View
        style={inputStyle}
        className="border-t border-neutral-100 px-4 py-2"
      >
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={handleImagePick}
            className="p-2"
          >
            <Ionicons name="attach" size={24} color="#45B7D1" />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            value={newMessage}
            onChangeText={handleTyping}
            placeholder="Type a message..."
            className="flex-1 bg-neutral-100 rounded-full px-4 py-2 mx-2"
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
            className={`p-2 ${
              !newMessage.trim() ? 'opacity-50' : ''
            }`}
          >
            <LinearGradient
              colors={['#45B7D1', '#4ECDC4']}
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              <Ionicons name="send" size={20} color="white" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Connection Status */}
      {!isConnected && (
        <BlurView
          intensity={20}
          tint="light"
          className="absolute bottom-16 left-4 right-4"
        >
          <View className="bg-white/90 rounded-full px-4 py-2 flex-row items-center justify-center">
            <Ionicons name="wifi" size={16} color="#FF6B6B" />
            <Text className="ml-2 text-neutral-800">
              Reconnecting...
            </Text>
          </View>
        </BlurView>
      )}
    </KeyboardAvoidingView>
  );
}
