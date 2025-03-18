import React from 'react';
import { SafeAreaView, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function ChatDetailScreen() {
  const router = useRouter();
  const { id } = router.query;

  return (
    <SafeAreaView>
      <Text>Chat ID: {id}</Text>
      {/* Fetch and display chat messages for the group or one-to-one chat here */}
    </SafeAreaView>
  );
}
