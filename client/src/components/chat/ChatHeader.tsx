import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

interface ChatHeaderProps {
  userId: string;
  isTyping: boolean;
  onBack: () => void;
  userImage?: string;
  userName?: string;
  lastSeen?: string;
  isOnline?: boolean;
}

export function ChatHeader({ 
  userId, 
  isTyping, 
  onBack, 
  userImage, 
  userName = "User",
  lastSeen,
  isOnline = false 
}: ChatHeaderProps) {
  return (
    <BlurView intensity={50} className="px-4 py-3 border-b border-neutral-200">
      <View className="flex-row items-center">
        <TouchableOpacity onPress={onBack} className="mr-3">
          <Ionicons name="chevron-back" size={28} color="#374151" />
        </TouchableOpacity>

        <Image 
          source={{ uri: userImage || 'https://placeholder.com/user' }}
          className="w-10 h-10 rounded-full mr-3"
        />

        <View className="flex-1">
          <Text className="text-lg font-semibold text-gray-800">{userName}</Text>
          <View className="flex-row items-center">
            {isTyping ? (
              <Text className="text-sm text-blue-500">typing...</Text>
            ) : (
              <>
                <View 
                  className={`w-2 h-2 rounded-full mr-1 ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`} 
                />
                <Text className="text-sm text-gray-500">
                  {isOnline ? 'Online' : lastSeen || 'Offline'}
                </Text>
              </>
            )}
          </View>
        </View>

        <View className="flex-row items-center gap-4">
          <TouchableOpacity>
            <Ionicons name="videocam-outline" size={24} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="call-outline" size={22} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity>
            <Ionicons name="ellipsis-vertical" size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>
    </BlurView>
  );
}