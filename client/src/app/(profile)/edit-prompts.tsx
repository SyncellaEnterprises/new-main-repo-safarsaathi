import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PROMPTS } from '@/src/constants/prompts';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SelectedPrompt {
  id: string;
  question: string;
  answer: string;
}

export default function EditPromptsScreen() {
  const router = useRouter();
  const [selectedPrompts, setSelectedPrompts] = useState<SelectedPrompt[]>([]);
  const [activePrompt, setActivePrompt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [changedPrompts, setChangedPrompts] = useState(false);
  const [promptInput, setPromptInput] = useState('');
  const MAX_PROMPTS = 2;
  const MAX_CHARS = 150;

  useEffect(() => {
    fetchUserPrompts();
  }, []);

  const fetchUserPrompts = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch('http://10.0.2.2:5000/api/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success" && data.user && data.user.prompts) {
          const userPrompts = data.user.prompts.prompts || [];
          
          // Convert API prompts to our format
          const formattedPrompts = userPrompts.map((prompt: any, index: number) => {
            // Find the matching prompt in our list
            const matchingPrompt = PROMPTS.find(p => p.question === prompt.question);
            return {
              id: matchingPrompt?.id || String(index + 1),
              question: prompt.question,
              answer: prompt.answer
            };
          });
          
          setSelectedPrompts(formattedPrompts);
        }
      } else {
        Alert.alert('Error', 'Failed to load prompts');
      }
    } catch (error) {
      console.error('Error fetching prompts:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPrompt = (prompt: typeof PROMPTS[0]) => {
    if (selectedPrompts.length >= MAX_PROMPTS && !selectedPrompts.find(p => p.id === prompt.id)) {
      Alert.alert('Maximum Reached', `You can select up to ${MAX_PROMPTS} prompts.`);
      return;
    }
    setActivePrompt(prompt.id);
    setPromptInput(selectedPrompts.find(p => p.id === prompt.id)?.answer || '');
  };

  const handleSaveAnswer = () => {
    if (!activePrompt || !promptInput.trim()) return;
    
    setSelectedPrompts(prev => {
      const existing = prev.find(p => p.id === activePrompt);
      if (existing) {
        return prev.map(p => p.id === activePrompt ? { ...p, answer: promptInput } : p);
      }
      return [...prev, { 
        id: activePrompt, 
        question: PROMPTS.find(p => p.id === activePrompt)!.question, 
        answer: promptInput
      }];
    });
    
    setChangedPrompts(true);
    setActivePrompt(null);
  };

  const handleRemovePrompt = (id: string) => {
    setSelectedPrompts(prev => prev.filter(p => p.id !== id));
    setChangedPrompts(true);
  };

  const handleSave = async () => {
    if (!changedPrompts) {
      Alert.alert('No Changes', 'No changes were made to prompts');
      return;
    }
    
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const prompts = selectedPrompts.map(p => ({
        question: p.question,
        answer: p.answer
      }));
      
      const response = await fetch('http://10.0.2.2:5000/api/update/prompts', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompts })
      });
      
      const result = await response.json();
      if (response.ok && result.status === 'success') {
        Alert.alert('Success', 'Prompts updated successfully');
        setChangedPrompts(false);
        router.back();
      } else {
        Alert.alert('Error', result.message || 'Failed to update prompts');
      }
    } catch (error) {
      console.error('Error saving prompts:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F8FAFF] justify-center items-center">
        <ActivityIndicator size="large" color="#1a237e" />
        <Text className="mt-4 text-[#1a237e]">Loading prompts...</Text>
      </View>
    );
  }

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
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isSaving || !changedPrompts}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#1a237e" />
            ) : (
              <Text className={`font-semibold ${changedPrompts ? 'text-[#1a237e]' : 'text-gray-400'}`}>
                Save
              </Text>
            )}
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
            <TouchableOpacity onPress={handleSaveAnswer}>
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
            value={promptInput}
            onChangeText={setPromptInput}
          />
          
          <Text className="text-right mt-2 text-slate-500">
            {promptInput.length}/{MAX_CHARS}
          </Text>
        </Animated.View>
      )}
    </View>
  );
} 