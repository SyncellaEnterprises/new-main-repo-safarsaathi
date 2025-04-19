import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSocket } from '@/src/context/SocketContext';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { Camera } from 'expo-camera';
import { BlurView } from 'expo-blur';

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

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const { socket, isConnected, isConnecting, joinChat, sendMessage, readMessage, sendTypingStatus } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [recipient, setRecipient] = useState<Recipient>({
    id: String(id),
    username: 'Loading...',
    profile_photo: null,
    isOnline: false
  });
  const [isLoading, setIsLoading] = useState(true);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const router = useRouter();

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

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

  // Render message items with Snapchat-style bubbles
  const renderMessage = ({ item }: { item: Message }) => {
    if (!item || !user) return null;
    
    const senderId = String(item.sender_id || '');
    const userId = String(user.id || '');
    const isOwnMessage = senderId === userId;
    
    return (
      <Animated.View 
        entering={FadeIn}
        className={`flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 px-2`}
      >
        <View className={`max-w-[85%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <LinearGradient
            colors={isOwnMessage 
              ? ['#1E9AFF', '#1E9AFF']  // Snapchat blue for own messages
              : ['#E8E8E8', '#E8E8E8']} // Light gray for received messages
            className={`rounded-3xl px-4 py-3 ${
              isOwnMessage ? 'rounded-tr-sm' : 'rounded-tl-sm'
            }`}
          >
            {item.type === 'text' && (
              <Text className={`${isOwnMessage ? 'text-white' : 'text-black'} font-medium text-base`}>
                {item.content}
              </Text>
            )}
            {item.type === 'image' && (
              <Image 
                source={{ uri: item.content }}
                className="w-48 h-48 rounded-2xl"
                resizeMode="cover"
              />
            )}
          </LinearGradient>
          
          {/* Message Status */}
          <View className="flex-row items-center mt-1">
            <Text className="text-xs text-neutral-500 font-medium">
              {formatMessageTime(item.sent_at)}
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
                  <Ionicons name="checkmark-done" size={14} color="#1E9AFF" />
                )}
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    );
  };

  // Camera view component
  const renderCameraView = () => (
    <View className="absolute inset-0 bg-black">
      {hasPermission && (
        <Camera
          ref={cameraRef}
          className="flex-1"
          type={Camera.Constants.Type.back}
        >
          <View className="flex-1 bg-transparent">
            <BlurView intensity={100} className="absolute bottom-0 left-0 right-0 h-24">
              <View className="flex-row items-center justify-around py-4">
                <TouchableOpacity onPress={() => setShowCamera(false)}>
                  <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  className="w-16 h-16 rounded-full border-4 border-white items-center justify-center"
                  onPress={() => {/* Handle capture */}}
                >
                  <View className="w-12 h-12 rounded-full bg-white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {/* Switch camera */}}>
                  <Ionicons name="camera-reverse" size={30} color="white" />
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Camera>
      )}
    </View>
  );

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
    <SafeAreaView className="flex-1 bg-white">
      {/* Minimal Header */}
      <View className="px-4 py-2 flex-row items-center border-b border-gray-100">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="p-2"
        >
          <Ionicons name="chevron-back" size={24} color="#1E9AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.push({
            pathname: "/profile/[id]",
            params: { id: recipient.id }
          })}
          className="flex-row items-center flex-1 ml-2"
        >
          <Image
            source={{ 
              uri: recipient.profile_photo || 
                'https://via.placeholder.com/400x400?text=No+Profile+Image'
            }}
            className="w-8 h-8 rounded-full"
          />
          <View className="ml-2">
            <Text className="text-base font-bold text-gray-900">
              {recipient.username}
            </Text>
            <Text className="text-xs text-gray-500">
              {recipient.isOnline ? (isTyping ? 'typing...' : 'Online') : 'Offline'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.message_id}
        contentContainerStyle={[
          messages.length === 0 ? { flex: 1 } : { paddingVertical: 16 },
          { paddingBottom: 80 }
        ]}
        inverted={false}
        className="flex-1 bg-white"
      />

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="border-t border-gray-100"
      >
        <View className="flex-row items-center p-2 bg-white">
          <TouchableOpacity 
            onPress={() => setShowCamera(true)}
            className="p-2"
          >
            <Ionicons name="camera" size={28} color="#1E9AFF" />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center bg-gray-100 rounded-full mx-2 px-4 py-2">
            <TextInput
              value={newMessage}
              onChangeText={text => {
                setNewMessage(text);
                // Handle typing indicator
                if (!typingTimerRef.current && text.length > 0) {
                  sendTypingStatus(String(id), true);
                }
                if (typingTimerRef.current) {
                  clearTimeout(typingTimerRef.current);
                }
                typingTimerRef.current = setTimeout(() => {
                  sendTypingStatus(String(id), false);
                  typingTimerRef.current = null;
                }, 1000);
              }}
              placeholder="Send a chat"
              className="flex-1 text-base text-gray-900"
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity>
              <Ionicons name="happy" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {newMessage.trim() ? (
            <TouchableOpacity
              onPress={() => {
                if (newMessage.trim()) {
                  sendMessage(newMessage.trim(), String(id));
                  setNewMessage('');
                  if (typingTimerRef.current) {
                    clearTimeout(typingTimerRef.current);
                    sendTypingStatus(String(id), false);
                    typingTimerRef.current = null;
                  }
                }
              }}
              className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center"
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity className="p-2">
              <Ionicons name="image" size={28} color="#1E9AFF" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Camera Overlay */}
      {showCamera && renderCameraView()}
    </SafeAreaView>
  );
}
