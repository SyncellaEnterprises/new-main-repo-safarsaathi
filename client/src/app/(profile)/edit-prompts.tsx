import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PROMPTS } from '@/src/constants/prompts';

export default function EditPromptsScreen() {
  const router = useRouter();
  const [selectedPrompts, setSelectedPrompts] = useState<SelectedPrompt[]>([]);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const MAX_PROMPTS = 2;
  const MAX_CHARS = 150;

  const handleSelectPrompt = (prompt: typeof PROMPTS[0]) => {
    if (selectedPrompts.length >= MAX_PROMPTS && !selectedPrompts.find(p => p.id === prompt.id)) {
      return;
    }
    setActivePrompt(prompt.id);
  };

  const handleSaveAnswer = (id: string, answer: string) => {
    if (answer.trim()) {
      setSelectedPrompts(prev => {
        const existing = prev.find(p => p.id === id);
        if (existing) {
          return prev.map(p => p.id === id ? { ...p, answer } : p);
        }
        return [...prev, { 
          id, 
          question: PROMPTS.find(p => p.id === id)!.question, 
          answer 
        }];
      });
    }
    setActivePrompt(null);
  };

  const handleRemovePrompt = (id: string) => {
    setSelectedPrompts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <View className="flex-1 bg-[#F8FAFF]">
      <Animated.View 
        entering={FadeInDown.duration(500)}
        className="bg-white px-6 pt-6 pb-4 border-b border-slate-100"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#1a237e" />
            <Text className="ml-2 text-[#1a237e]">Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-[#1a237e]">Prompts</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text className="text-[#1a237e] font-semibold">Save</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-2xl font-bold text-[#1a237e] mb-2">
          Your Prompts
        </Text>
        <Text className="text-slate-500 mb-6">
          Add up to {MAX_PROMPTS} prompts to show your personality
        </Text>

        {PROMPTS.map((prompt, index) => {
          const selectedPrompt = selectedPrompts.find(p => p.id === prompt.id);
          const isSelected = !!selectedPrompt;
          
          return (
            <Animated.View
              key={prompt.id}
              entering={FadeIn.delay(index * 100)}
              className="mb-4"
            >
              <TouchableOpacity
                onPress={() => handleSelectPrompt(prompt)}
                className={`p-4 rounded-xl border-2 ${
                  isSelected 
                    ? 'border-[#1a237e] bg-indigo-50' 
                    : 'border-slate-200'
                }`}
              >
                <Text className="text-lg font-semibold text-[#1a237e]">
                  {prompt.question}
                </Text>
                {isSelected && (
                  <View className="mt-2">
                    <Text className="text-slate-600">
                      {selectedPrompt.answer}
                    </Text>
                    <TouchableOpacity 
                      onPress={() => handleRemovePrompt(prompt.id)}
                      className="absolute right-0 top-0"
                    >
                      <Ionicons name="close-circle" size={20} color="#FF6F3C" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </ScrollView>

      {activePrompt && (
        <Animated.View 
          entering={FadeIn}
          className="absolute inset-0 bg-white px-6 pt-6"
        >
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={() => setActivePrompt(null)}>
              <Ionicons name="close" size={24} color="#1a237e" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-[#1a237e]">Your Answer</Text>
            <TouchableOpacity onPress={() => {
              const input = document.querySelector('textarea') as HTMLTextAreaElement;
              handleSaveAnswer(activePrompt, input?.value || '');
            }}>
              <Text className="text-[#1a237e] font-semibold">Save</Text>
            </TouchableOpacity>
          </View>

          <Text className="text-xl font-semibold text-[#1a237e] mb-4">
            {PROMPTS.find(p => p.id === activePrompt)?.question}
          </Text>

          <TextInput
            multiline
            maxLength={MAX_CHARS}
            placeholder="Type your answer..."
            className="text-lg text-slate-800 border-2 border-slate-200 rounded-xl p-4"
            autoFocus
            defaultValue={selectedPrompts.find(p => p.id === activePrompt)?.answer}
          />
        </Animated.View>
      )}
    </View>
  );
} 