import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  return (
    <View>
      <Text>Chat {id}</Text>
    </View>
  );
} 