import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import Animated, { FadeIn } from 'react-native-reanimated';
import { format } from 'date-fns';

const REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '😡'];

interface Message {
  id: string;
  type: 'text' | 'image' | 'audio';
  content: string;
  senderId: string;
  timestamp: string;
  reactions?: string[];
  isRead?: boolean;
}

interface MessageListProps {
  messages: Message[];
  onLoadMore: () => void;
  onDelete: (messageId: string) => void;
  onEdit: (messageId: string, newContent: string) => void;
  onReaction: (messageId: string, reaction: string) => void;
}

export function MessageList({ 
  messages, 
  onLoadMore, 
  onDelete, 
  onEdit, 
  onReaction 
}: MessageListProps) {
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [showReactions, setShowReactions] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const playAudio = async (uri: string) => {
    try {
      if (sound) {
        await sound.unloadAsync();
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri });
      setSound(newSound);
      await newSound.playAsync();
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const renderMessage = ({ item: message }: { item: Message }) => {
    const isOwnMessage = message.senderId === 'currentUserId'; // Replace with actual user ID

    return (
      <Animated.View 
        entering={FadeIn}
        className={`px-4 py-2 ${isOwnMessage ? 'items-end' : 'items-start'}`}
      >
        <TouchableOpacity
          onLongPress={() => setShowReactions(message.id)}
          className={`max-w-[80%] rounded-2xl p-3 ${
            isOwnMessage ? 'bg-primary' : 'bg-neutral-100'
          }`}
        >
          {message.type === 'text' && (
            <Text className={isOwnMessage ? 'text-white' : 'text-neutral-800'}>
              {message.content}
            </Text>
          )}

          {message.type === 'image' && (
            <Image 
              source={{ uri: message.content }}
              className="w-48 h-48 rounded-lg"
            />
          )}

          {message.type === 'audio' && (
            <TouchableOpacity 
              onPress={() => playAudio(message.content)}
              className="flex-row items-center space-x-2"
            >
              <Ionicons name="play" size={20} color={isOwnMessage ? 'white' : '#374151'} />
              <View className="h-1 w-32 bg-neutral-200 rounded-full" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Reactions */}
        {message.reactions?.length > 0 && (
          <View className="flex-row mt-1 space-x-1">
            {message.reactions.map((reaction, index) => (
              <Text key={index}>{reaction}</Text>
            ))}
          </View>
        )}

        {/* Read Receipt */}
        {isOwnMessage && message.isRead && (
          <Text className="text-xs text-neutral-500 mt-1">Read</Text>
        )}

        {/* Reaction Picker */}
        {showReactions === message.id && (
          <View className="flex-row bg-white rounded-full p-2 shadow-lg mt-2">
            {REACTIONS.map((reaction) => (
              <TouchableOpacity
                key={reaction}
                onPress={() => {
                  onReaction(message.id, reaction);
                  setShowReactions(null);
                }}
                className="px-2"
              >
                <Text className="text-xl">{reaction}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <FlatList
      data={messages}
      renderItem={renderMessage}
      keyExtractor={(item) => item.id}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      inverted
    />
  );
} 