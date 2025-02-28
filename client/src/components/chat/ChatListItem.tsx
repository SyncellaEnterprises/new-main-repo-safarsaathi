import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChatListItemProps {
  chat: {
    id: string;
    name: string;
    avatar: string;
    lastMessage: string;
    timestamp: string;
    unreadCount: number;
    isOnline: boolean;
    isPinned?: boolean;
  };
  onPress: () => void;
}

export function ChatListItem({ chat, onPress }: ChatListItemProps) {
  return (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 bg-white active:bg-neutral-light/50"
      onPress={onPress}
    >
      <View className="relative">
        <Image
          source={{ uri: chat.avatar }}
          className="w-14 h-14 rounded-full"
        />
        {chat.isOnline && (
          <View className="absolute bottom-0 right-0 w-3 h-3 bg-accent rounded-full border-2 border-white" />
        )}
      </View>

      <View className="flex-1 ml-3">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Text className="text-base font-semibold text-neutral-dark">
              {chat.name}
            </Text>
            {chat.isPinned && (
              <Ionicons 
                name="pin" 
                size={14} 
                color="#FF6F3C" 
                style={{ marginLeft: 4 }}
              />
            )}
          </View>
          <Text className="text-sm text-neutral-dark/60">
            {chat.timestamp}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mt-1">
          <Text 
            className="text-sm text-neutral-dark/80 flex-1 mr-4"
            numberOfLines={1}
          >
            {chat.lastMessage}
          </Text>
          {chat.unreadCount > 0 && (
            <View className="bg-primary rounded-full min-w-[20px] h-5 px-1.5 items-center justify-center">
              <Text className="text-xs text-white font-bold">
                {chat.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
} 