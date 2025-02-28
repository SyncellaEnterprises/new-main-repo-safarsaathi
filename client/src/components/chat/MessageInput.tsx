import React, { useState, useRef } from 'react';
import { View, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useAnimatedStyle, 
  withSpring,
  useSharedValue 
} from 'react-native-reanimated';

interface MessageInputProps {
  onSend: (text: string) => void;
  isConnected: boolean;
  onTyping: () => void;
}

export function MessageInput({ onSend, isConnected, onTyping }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const inputRef = useRef<TextInput>(null);
  const sendScale = useSharedValue(1);

  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(sendScale.value) }]
  }));

  const handleSend = () => {
    if (message.trim() && isConnected) {
      onSend(message.trim());
      setMessage('');
      Keyboard.dismiss();
      sendScale.value = withSpring(0.8, {}, () => {
        sendScale.value = withSpring(1);
      });
    }
  };

  return (
    <View className="flex-1 flex-row items-center bg-gray-50 rounded-2xl px-4 py-2">
      <TouchableOpacity className="mr-2">
        <Ionicons name="happy-outline" size={24} color="#374151" />
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        value={message}
        onChangeText={(text) => {
          setMessage(text);
          onTyping();
        }}
        placeholder="Message..."
        placeholderTextColor="#9CA3AF"
        multiline
        maxLength={1000}
        className="flex-1 max-h-32 text-base text-gray-800"
        onSubmitEditing={handleSend}
      />

      {message.trim() ? (
        <Animated.View style={sendButtonStyle}>
          <TouchableOpacity 
            onPress={handleSend}
            className="ml-2 bg-blue-500 w-8 h-8 rounded-full items-center justify-center"
          >
            <Ionicons name="send" size={18} color="white" />
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <TouchableOpacity className="ml-2">
          <Ionicons name="camera-outline" size={24} color="#374151" />
        </TouchableOpacity>
      )}
    </View>
  );
} 