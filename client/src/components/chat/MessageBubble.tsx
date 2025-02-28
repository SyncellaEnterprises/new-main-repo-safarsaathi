import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    type: 'text' | 'image' | 'audio' | 'document';
    timestamp: string;
    senderId: string;
    status?: 'sent' | 'delivered' | 'read';
  };
  isOwn: boolean;
  onLongPress: () => void;
}

export function MessageBubble({ message, isOwn, onLongPress }: MessageBubbleProps) {
  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <Image 
            source={{ uri: message.content }}
            className="w-48 h-48 rounded-2xl"
            resizeMode="cover"
          />
        );
      case 'audio':
        return (
          <View className="flex-row items-center bg-white/80 p-2 rounded-xl">
            <Ionicons name="play" size={20} color="#374151" />
            <View className="h-1 bg-gray-200 flex-1 mx-2 rounded-full">
              <View className="h-1 w-1/3 bg-blue-500 rounded-full" />
            </View>
            <Text className="text-xs text-gray-500">0:32</Text>
          </View>
        );
      default:
        return (
          <Text className={`text-base ${isOwn ? 'text-white' : 'text-gray-800'}`}>
            {message.content}
          </Text>
        );
    }
  };

  return (
    <TouchableOpacity 
      onLongPress={onLongPress}
      className={`max-w-[80%] mb-2 ${isOwn ? 'self-end' : 'self-start'}`}
    >
      <View 
        className={`
          rounded-2xl p-3
          ${isOwn ? 'bg-blue-500' : 'bg-gray-100'}
          ${message.type === 'image' ? 'p-1' : 'p-3'}
        `}
      >
        {renderContent()}
      </View>
      <View className={`flex-row items-center mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <Text className="text-xs text-gray-500 mr-1">
          {format(new Date(message.timestamp), 'HH:mm')}
        </Text>
        {isOwn && (
          <Ionicons 
            name={
              message.status === 'read' 
                ? 'checkmark-done' 
                : message.status === 'delivered' 
                ? 'checkmark-done-outline' 
                : 'checkmark-outline'
            } 
            size={16} 
            color={message.status === 'read' ? '#3B82F6' : '#9CA3AF'} 
          />
        )}
      </View>
    </TouchableOpacity>
  );
} 