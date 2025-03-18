import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSocket } from '@/src/context/SocketContext';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface Message {
  id: string;
  content: string;
  sender: string;
  sent_at: string;
  type: 'text' | 'image' | 'video';
}

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const socket = useSocket();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Load initial messages (you'll need to implement this)
  useEffect(() => {
    // Fetch chat history from API
  }, [id]);

  useEffect(() => {
    if (!socket) return;

    // Join the chat room
    socket.emit('join_chat', { chatId: id });

    // Listen for new messages
    socket.on('new_message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    // Listen for typing events
    socket.on('typing', ({ isTyping: typingStatus }) => {
      // Handle typing indicator for other users
    });

    return () => {
      socket.off('new_message');
      socket.off('typing');
      socket.emit('leave_chat', { chatId: id });
    };
  }, [socket, id]);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim() || !socket || !user) return;

    const messageData = {
      content: newMessage,
      chatId: id,
      type: 'text'
    };

    // Optimistic update
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: newMessage,
      sender: user.username,
      sent_at: new Date().toISOString(),
      type: 'text'
    }]);

    socket.emit('send_message', messageData);
    setNewMessage('');
  }, [newMessage, socket, user, id]);

  const handleTyping = useCallback((typing: boolean) => {
    if (!socket) return;
    socket.emit('typing', { chatId: id, isTyping: typing });
  }, [socket, id]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View className={`p-3 m-2 rounded-lg max-w-[80%] ${
            item.sender === user?.username 
              ? 'bg-blue-500 self-end'
              : 'bg-white self-start'
          }`}>
            <Text className={`${
              item.sender === user?.username 
                ? 'text-white' 
                : 'text-gray-800'
            }`}>
              {item.content}
            </Text>
            <Text className={`text-xs ${
              item.sender === user?.username 
                ? 'text-blue-200' 
                : 'text-gray-500'
            }`}>
              {new Date(item.sent_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        )}
        inverted
        className="flex-1 p-2"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="p-2 border-t border-gray-200 bg-white"
      >
        <View className="flex-row items-center">
          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            className="flex-1 p-2 border border-gray-300 rounded-lg mr-2"
            onFocus={() => handleTyping(true)}
            onBlur={() => handleTyping(false)}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity
            onPress={sendMessage}
            className="p-2 bg-blue-500 rounded-lg"
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
