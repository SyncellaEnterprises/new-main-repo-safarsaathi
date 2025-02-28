import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface VerificationBadgeProps {
  isVerified: boolean;
  onVerify: () => void;
}

export default function VerificationBadge({ isVerified, onVerify }: VerificationBadgeProps) {
  if (isVerified) {
    return (
      <View className="flex-row items-center justify-center bg-green-100 py-2 px-4 rounded-full mt-4">
        <Ionicons name="checkmark-circle" size={20} color="#059669" />
        <Text className="text-green-700 ml-2 font-medium">Verified Profile</Text>
      </View>
    );
  }

  return (
    <TouchableOpacity 
      onPress={onVerify}
      className="flex-row items-center justify-center bg-yellow-100 py-2 px-4 rounded-full mt-4"
    >
      <Ionicons name="shield-outline" size={20} color="#B45309" />
      <Text className="text-yellow-700 ml-2 font-medium">Verify Profile</Text>
    </TouchableOpacity>
  );
} 