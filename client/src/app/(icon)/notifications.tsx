import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { format } from 'date-fns';

interface Notification {
  id: string;
  type: 'like' | 'match' | 'message' | 'superlike' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  userImage?: string;
  actionUrl?: string;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return { name: 'heart', color: '#FF4B4B', bg: '#FFE8E8' };
      case 'match':
        return { name: 'sparkles', color: '#FFB800', bg: '#FFF8E8' };
      case 'message':
        return { name: 'chatbubble', color: '#00B2FF', bg: '#E8F7FF' };
      case 'superlike':
        return { name: 'star', color: '#9D3FFF', bg: '#F3E8FF' };
      default:
        return { name: 'notifications', color: '#00C48C', bg: '#E8FFF5' };
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const icon = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity 
        className={`px-4 py-3 flex-row items-center ${!item.read ? 'bg-blue-50' : 'bg-white'}`}
      >
        {item.userImage ? (
          <Image 
            source={{ uri: item.userImage }}
            className="w-12 h-12 rounded-full"
          />
        ) : (
          <View 
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: icon.bg }}
          >
            <Ionicons name={icon.name} size={24} color={icon.color} />
          </View>
        )}

        <View className="flex-1 ml-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-800">
              {item.title}
            </Text>
            <Text className="text-xs text-gray-500">
              {format(new Date(item.timestamp), 'MMM d, h:mm a')}
            </Text>
          </View>
          <Text className="text-gray-600 mt-1" numberOfLines={2}>
            {item.message}
          </Text>
        </View>

        {!item.read && (
          <View className="w-2 h-2 rounded-full bg-blue-500 ml-2" />
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <BlurView intensity={80} className="px-4 py-3 border-b border-gray-200">
      <View className="flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-gray-800">Notifications</Text>
        <TouchableOpacity 
          onPress={() => setNotifications(prev => 
            prev.map(n => ({ ...n, read: true }))
          )}
        >
          <Text className="text-blue-500">Mark all as read</Text>
        </TouchableOpacity>
      </View>
    </BlurView>
  );

  const renderEmpty = () => (
    <View className="flex-1 items-center justify-center py-20">
      <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
        <Ionicons name="notifications-off-outline" size={32} color="#9CA3AF" />
      </View>
      <Text className="text-gray-500 text-center">
        No notifications yet{'\n'}Check back later!
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={item => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              // Fetch new notifications here
              setTimeout(() => setRefreshing(false), 1000);
            }}
          />
        }
        ItemSeparatorComponent={() => (
          <View className="h-[1px] bg-gray-100" />
        )}
      />
    </SafeAreaView>
  );
}