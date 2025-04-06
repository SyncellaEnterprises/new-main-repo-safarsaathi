import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInDown, 
  FadeIn,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
  withTiming
} from 'react-native-reanimated';
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";

const PROMPTS = [
  { id: '1', question: 'The one thing I want to know about you is...' },
  { id: '2', question: 'My most controversial opinion is...' },
  { id: '3', question: 'My perfect travel day looks like...' },
  { id: '4', question: 'Two truths and a lie...' },
  { id: '5', question: 'My biggest adventure was...' },
  { id: '6', question: 'My life goal is to...' },
  { id: '7', question: 'My perfect date would be...' },
  { id: '8', question: 'I get way too excited about...' },
];

const MIN_PROMPTS = 2;
const MAX_PROMPTS = 3;
const MIN_CHARS = 20;
const MAX_CHARS = 200;

interface PromptAnswer {
  promptId: string;
  question: string;
  answer: string;
}

export default function PromptsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updatePrompts, isLoading } = useOnboarding();
  const [selectedPrompts, setSelectedPrompts] = useState<PromptAnswer[]>([]);
  const scale = useSharedValue(1);
  const progress = useSharedValue(0);

  const progressStyle = useAnimatedStyle(() => ({
    width: withSpring((100 * selectedPrompts.length) / MAX_PROMPTS),
    height: 3,
    backgroundColor: selectedPrompts.length >= MIN_PROMPTS ? '#10b981' : '#6366f1',
    borderRadius: 2,
  }));

  const handleSelectPrompt = (prompt: { id: string; question: string }) => {
    if (selectedPrompts.length >= MAX_PROMPTS && !selectedPrompts.find(p => p.promptId === prompt.id)) {
      toast.show(`Maximum ${MAX_PROMPTS} prompts allowed`, "error");
      return;
    }

    scale.value = withSpring(1.05, {}, () => {
      scale.value = withSpring(1);
    });

    setSelectedPrompts(prev => {
      const exists = prev.find(p => p.promptId === prompt.id);
      if (exists) {
        return prev.filter(p => p.promptId !== prompt.id);
      }
      return [...prev, { promptId: prompt.id, question: prompt.question, answer: '' }];
    });
  };

  const handleAnswerChange = (promptId: string, answer: string) => {
    if (answer.length <= MAX_CHARS) {
      setSelectedPrompts(prev => 
        prev.map(p => 
          p.promptId === promptId ? { ...p, answer } : p
        )
      );
    }
  };

  const isValidAnswers = () => {
    return selectedPrompts.length >= MIN_PROMPTS && 
           selectedPrompts.every(p => p.answer.length >= MIN_CHARS);
  };

  const handleNext = async () => {
    if (selectedPrompts.length < MIN_PROMPTS) {
      toast.show(`Please select at least ${MIN_PROMPTS} prompts`, "error");
      return;
    }

    if (!isValidAnswers()) {
      toast.show(`Each answer must be at least ${MIN_CHARS} characters`, "error");
      return;
    }

    const success = await updatePrompts(
      selectedPrompts.map(p => ({
        question: p.question,
        answer: p.answer.trim()
      }))
    );

    if (success) {
      router.push('/(tabs)/home');
    } else {
      toast.show("Failed to save prompts. Please try again.", "error");
    }
  };

  return (
    <View className="flex-1 bg-primary-light">
      <ScrollView className="flex-1">
        <Animated.View 
          entering={FadeInDown.duration(1000).springify()}
          className="flex-1 p-6"
        >
          <Text className="text-3xl font-bold mb-2 text-indigo-600">
            Answer Some Prompts
          </Text>
          <Text className="text-slate-500 mb-4">
            Select {MIN_PROMPTS}-{MAX_PROMPTS} prompts and share your thoughts
          </Text>

          <View className="mt-2 mb-6">
            <Animated.View style={progressStyle} />
            <View className="flex-row items-center justify-between mt-2">
              <Text className="text-indigo-600 font-medium">
                {selectedPrompts.length}/{MAX_PROMPTS} selected
              </Text>
              {selectedPrompts.length < MIN_PROMPTS && (
                <Text className="text-indigo-500 text-sm">
                  Select at least {MIN_PROMPTS}
                </Text>
              )}
            </View>
          </View>

          <View className="space-y-4">
            {PROMPTS.map((prompt, index) => {
              const isSelected = selectedPrompts.find(p => p.promptId === prompt.id);
              const answer = isSelected?.answer || '';

              return (
                <Animated.View
                  key={prompt.id}
                  entering={FadeIn.delay(index * 100)}
                  className={`bg-white rounded-2xl p-4 border ${
                    isSelected ? 'border-indigo-300' : 'border-indigo-100'
                  }`}
                >
                  <TouchableOpacity
                    onPress={() => handleSelectPrompt(prompt)}
                    disabled={isLoading}
                    className="flex-row items-center justify-between"
                  >
                    <Text className="text-slate-700 font-medium flex-1 mr-4">
                      {prompt.question}
                    </Text>
                    <Ionicons 
                      name={isSelected ? "chevron-up" : "chevron-down"} 
                      size={24} 
                      color="#6366f1" 
                    />
                  </TouchableOpacity>

                  {isSelected && (
                    <Animated.View 
                      entering={FadeInDown}
                      className="mt-4"
                    >
                      <TextInput
                        value={answer}
                        onChangeText={(text) => handleAnswerChange(prompt.id, text)}
                        placeholder="Type your answer..."
                        multiline
                        className="text-slate-600 min-h-[100]"
                        maxLength={MAX_CHARS}
                      />
                      <Text className={`text-sm mt-2 ${
                        answer.length >= MIN_CHARS ? 'text-green-600' : 'text-indigo-600'
                      }`}>
                        {answer.length}/{MAX_CHARS} characters
                        {answer.length < MIN_CHARS && ` (min ${MIN_CHARS})`}
                      </Text>
                    </Animated.View>
                  )}
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
        <View className="h-24" />
      </ScrollView>

      <Animated.View 
        entering={FadeInDown.delay(300)}
        className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-indigo-100 shadow-lg"
      >
        <TouchableOpacity
          onPress={handleNext}
          disabled={!isValidAnswers() || isLoading}
          className={`py-4 rounded-xl shadow-sm ${
            isValidAnswers() ? 'bg-indigo-600' : 'bg-slate-300'
          }`}
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-center text-lg font-semibold">
              {isValidAnswers() ? 'Finish' : `Complete ${MIN_PROMPTS} prompts`}
            </Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}