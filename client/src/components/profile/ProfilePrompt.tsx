import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ProfilePromptProps {
  prompt?: string;
  answer?: string;
  onEdit: () => void;
}

export default function ProfilePrompt({ prompt, answer, onEdit }: ProfilePromptProps) {
  if (!prompt && !answer) {
    return (
      <TouchableOpacity 
        onPress={onEdit}
        className="mt-6 p-4 border border-dashed border-indigo-300 rounded-xl"
      >
        <Text className="text-indigo-600 text-center">
          Add a prompt to your profile
        </Text>
      </TouchableOpacity>
    );
  }

  return (
    <View className="mt-6">
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-lg font-semibold text-slate-800">{prompt}</Text>
        <TouchableOpacity onPress={onEdit}>
          <Ionicons name="pencil" size={20} color="#6366F1" />
        </TouchableOpacity>
      </View>
      <Text className="text-slate-600 leading-6">{answer}</Text>
    </View>
  );
} 