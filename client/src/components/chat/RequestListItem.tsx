import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn } from 'react-native-reanimated';

interface RequestListItemProps {
  request: {
    id: string;
    name: string;
    avatar: string;
    message: string;
  };
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
}

export function RequestListItem({ request, onAccept, onDecline }: RequestListItemProps) {
  return (
    <Animated.View 
      entering={FadeIn}
      className="w-64 bg-white rounded-xl p-3 border border-neutral-100"
    >
      <View className="flex-row items-center space-x-3">
        <Image
          source={{ uri: request.avatar }}
          className="w-12 h-12 rounded-full"
        />
        <View className="flex-1">
          <Text className="font-semibold text-neutral-800" numberOfLines={1}>
            {request.name}
          </Text>
          <Text className="text-sm text-neutral-500" numberOfLines={2}>
            {request.message}
          </Text>
        </View>
      </View>
      
      <View className="flex-row space-x-2 mt-3">
        <TouchableOpacity
          onPress={() => onDecline(request.id)}
          className="flex-1 py-2 rounded-full border border-neutral-200"
        >
          <Text className="text-center text-neutral-600">Decline</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onAccept(request.id)}
          className="flex-1 py-2 rounded-full bg-primary"
        >
          <Text className="text-center text-white">Accept</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
} 