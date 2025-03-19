import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSocket } from '@/src/context/SocketContext';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Message {
  message_id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  sent_at: string;
  type: 'text' | 'image' | 'video';
  status: 'sent' | 'delivered' | 'read';
  receiver_id?: string;
  group_id?: string;
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const { socket, isConnected, isConnecting } = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recipient, setRecipient] = useState({ name: '', image: '', isOnline: false });
  const router = useRouter();

  // Load initial messages (you'll need to implement this)
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://10.0.2.2:4000/api/messages/${id}`, {
          headers: {
            'Authorization': `Bearer ${await AsyncStorage.getItem('accessToken')}`
          }
        });
        const data = await response.json();
        setMessages(data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    };
    
    fetchMessages();
  }, [id]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join chat room with proper parameters
    socket.emit('join_chat', { 
      chat_type: 'private', // or 'group' based on chat type
      chat_id: id,
      other_user_id: recipient.id // You'll need to get recipient ID
    });

    // Update event listeners
    socket.on('chat_history', (history: Message[]) => {
      setMessages(history);
    });

    socket.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
      if (message.receiver_id === user.id) {
        socket.emit('message_read', { message_id: message.message_id });
      }
    });

    socket.on('message_status', ({ message_id, status }) => {
      setMessages(prev => prev.map(msg => 
        msg.message_id === message_id ? { ...msg, status } : msg
      ));
    });

    socket.on('typing_status', ({ users, chat_type, chat_id }) => {
      if (chat_id === id) {
        setIsTyping(users.length > 0);
      }
    });

    // Listen for user status changes
    socket.on('user_status', ({ username, status }) => {
      if (username === recipient.name) {
        setRecipient(prev => ({ ...prev, isOnline: status === 'online' }));
      }
    });

    return () => {
      socket.emit('leave_chat', { chat_id: id });
      socket.off('chat_history');
      socket.off('new_message');
      socket.off('message_status');
      socket.off('typing_status');
      socket.off('user_status');
    };
  }, [socket, isConnected, id, user]);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !socket || !user) return;

    const messageData = {
      content: newMessage,
      receiver_id: recipient.id, // Should come from route params
      type: 'text'
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
  }, [newMessage, socket, user, recipient]);

  const handleTyping = useCallback((typing: boolean) => {
    if (!socket || !user) return;
    socket.emit('typing', {
      chat_type: 'private',
      chat_id: id,
      is_typing: typing
    });
  }, [socket, id, user]);

  const renderMessage = ({ item }: { item: Message }) => {
    const isOwnMessage = item.sender_id === user?.id;
    
    return (
      <View className={`flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}>
        {!isOwnMessage && (
          <Image
            source={{ uri: recipient.image }}
            className="h-8 w-8 rounded-full mr-2 self-end"
          />
        )}
        
        <View className={`${
          isOwnMessage 
            ? 'bg-blue-500 rounded-t-2xl rounded-l-2xl' 
            : 'bg-white rounded-t-2xl rounded-r-2xl'
          } p-3 max-w-[75%] shadow-sm`}
        >
          <Text className={`${
            isOwnMessage ? 'text-white' : 'text-gray-800'
          } text-base`}>
            {item.content}
          </Text>
          
          <View className="flex-row items-center justify-end mt-1">
            <Text className={`text-xs mr-1 ${
              isOwnMessage ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {new Date(item.sent_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
            
            {isOwnMessage && (
              <Ionicons 
                name={item.status === 'read' ? 'checkmark-done' : 'checkmark'} 
                size={16} 
                color={item.status === 'read' ? '#93C5FD' : '#BFDBFE'}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  // Show loading state
  if (isConnecting) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Connecting to chat...</Text>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text>Connection lost. Reconnecting...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#60A5FA']}
        className="px-4 py-3"
      >
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <Image
            source={{ uri: recipient.image }}
            className="h-10 w-10 rounded-full"
          />
          
          <View className="flex-1 ml-3">
            <Text className="text-white text-lg font-semibold">
              {recipient.name}
            </Text>
            <Text className="text-blue-100 text-sm">
              {recipient.isOnline ? 'Online' : 'Offline'}
            </Text>
          </View>

          <View className="flex-row">
            <TouchableOpacity className="mr-4">
              <Ionicons name="videocam" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="mr-4">
              <Ionicons name="call" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity>
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
        inverted
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      />

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="border-t border-gray-200 bg-white"
      >
        <View className="flex-row items-center p-2">
          <TouchableOpacity className="p-2">
            <Ionicons name="add-circle-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
          
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2 mx-2">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Message..."
              className="flex-1 text-base text-gray-800"
              multiline
              maxLength={500}
              onFocus={() => handleTyping(true)}
              onBlur={() => handleTyping(false)}
            />
            
            <TouchableOpacity className="mr-2">
              <Ionicons name="camera-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="mic-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={sendMessage}
            className="p-2 bg-blue-500 rounded-full"
            disabled={!newMessage.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
