import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInDown, 
  FadeIn,
  SlideInRight,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate,
  withTiming,
  ZoomIn
} from 'react-native-reanimated';
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const PROMPTS = [
  { id: '1', question: 'The one thing I want to know about you is...', icon: 'help-circle' },
  { id: '2', question: 'My most controversial opinion is...', icon: 'flame' },
  { id: '3', question: 'My perfect travel day looks like...', icon: 'airplane' },
  { id: '4', question: 'Two truths and a lie...', icon: 'game-controller' },
  { id: '5', question: 'My biggest adventure was...', icon: 'compass' },
  { id: '6', question: 'My life goal is to...', icon: 'trophy' },
  { id: '7', question: 'My perfect date would be...', icon: 'heart' },
  { id: '8', question: 'I get way too excited about...', icon: 'star' },
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
  const [isSkeletonVisible, setIsSkeletonVisible] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const scale = useSharedValue(1);
  const progress = useSharedValue(0);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSkeletonVisible(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${withSpring((100 * selectedPrompts.length) / MAX_PROMPTS)}%`,
    height: 4,
    backgroundColor: selectedPrompts.length >= MIN_PROMPTS ? '#50A6A7' : '#7D5BA6',
    borderRadius: 4,
  }));

  const handleSelectPrompt = (prompt: { id: string; question: string }) => {
    setSubmitError(null);
    
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
      setSubmitError(`Please select at least ${MIN_PROMPTS} prompts`);
      toast.show(`Please select at least ${MIN_PROMPTS} prompts`, "error");
      return;
    }

    if (!isValidAnswers()) {
      setSubmitError(`Each answer must be at least ${MIN_CHARS} characters`);
      toast.show(`Each answer must be at least ${MIN_CHARS} characters`, "error");
      return;
    }

    try {
      setSubmitError(null);
      const success = await updatePrompts(
        selectedPrompts.map(p => ({
          question: p.question,
          answer: p.answer.trim()
        }))
      );

      if (success) {
        router.push('/(tabs)/home');
      } else {
        setSubmitError("Failed to save prompts");
        toast.show("Failed to save prompts. Please try again.", "error");
      }
    } catch (error) {
      console.error('Prompt update error:', error);
      setSubmitError("An error occurred");
      toast.show("An error occurred. Please try again.", "error");
    }
  };

  // Render skeleton loaders for prompts
  const renderSkeletons = () => {
    return Array(4).fill(0).map((_, index) => (
      <Animated.View
        key={`skeleton-${index}`}
        entering={FadeIn.delay(index * 150)}
        className="bg-neutral-dark/50 rounded-2xl mb-4 overflow-hidden"
        style={{ height: 80 }}
      >
        <LinearGradient
          colors={['rgba(125, 91, 166, 0.1)', 'rgba(125, 91, 166, 0.2)', 'rgba(125, 91, 166, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-full h-full"
        />
      </Animated.View>
    ));
  };

  return (
    <View className="flex-1 bg-neutral-darkest">
      <ScrollView className="flex-1">
        <Animated.View 
          entering={FadeInDown.duration(1000).springify()}
          className="flex-1 p-6"
        >
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold mb-2 text-primary font-youngSerif">
              Add Your Prompts
            </Text>
            <Text className="text-neutral-medium mb-1 font-montserrat">
              Select {MIN_PROMPTS}-{MAX_PROMPTS} prompts and share something interesting about yourself
            </Text>
            
            {submitError && (
              <Animated.View 
                entering={SlideInRight}
                className="mt-3 bg-red-900/30 border border-red-500/30 rounded-lg p-3 flex-row items-center"
              >
                <Ionicons name="alert-circle" size={20} color="#f87171" />
                <Text className="text-red-400 ml-2 font-montserrat">{submitError}</Text>
              </Animated.View>
            )}
          </View>

          {/* Progress Indicator */}
          <View className="mb-6">
            <View className="bg-neutral-dark/50 h-4 rounded-full overflow-hidden">
              <Animated.View style={progressStyle} />
            </View>
            <View className="flex-row items-center justify-between mt-3">
              <View className="flex-row items-center">
                <Ionicons name="chatbubbles-outline" size={18} color="#9D7EBD" />
                <Text className="text-primary-light font-montserratMedium ml-2">
                  {selectedPrompts.length}/{MAX_PROMPTS} selected
                </Text>
              </View>
              <Text className={`text-sm font-montserrat ${selectedPrompts.length >= MIN_PROMPTS ? 'text-secondary' : 'text-neutral-medium'}`}>
                {selectedPrompts.length >= MIN_PROMPTS ? '✓ Minimum reached' : `Select at least ${MIN_PROMPTS}`}
              </Text>
            </View>
          </View>

          {/* Pro Tips Card */}
          <BlurView intensity={20} tint="dark" className="rounded-2xl mb-6 overflow-hidden">
            <LinearGradient
              colors={['rgba(125, 91, 166, 0.1)', 'rgba(157, 126, 189, 0.05)']}
              className="p-4 border border-primary-light/20"
              style={{ borderRadius: 16 }}
            >
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                  <Ionicons name="bulb-outline" size={20} color="#9D7EBD" />
                </View>
                <View className="flex-1">
                  <Text className="text-neutral-light font-montserratMedium mb-1">Pro Tips</Text>
                  <Text className="text-neutral-medium text-sm font-montserrat">
                    Be authentic in your answers. Thoughtful responses help potential matches connect with the real you.
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>

          {/* Prompts List */}
          <View className="space-y-4">
            {isSkeletonVisible ? (
              renderSkeletons()
            ) : (
              PROMPTS.map((prompt, index) => {
                const isSelected = selectedPrompts.find(p => p.promptId === prompt.id);
                const answer = isSelected?.answer || '';
                const isValidAnswer = answer.length >= MIN_CHARS;
                const cardScale = useSharedValue(1);

                return (
                  <Animated.View
                    key={prompt.id}
                    entering={FadeIn.delay(index * 100)}
                    className={`rounded-2xl overflow-hidden ${isSelected ? 'mb-6' : 'mb-3'}`}
                  >
                    <LinearGradient
                      colors={isSelected 
                        ? ['rgba(125, 91, 166, 0.3)', 'rgba(125, 91, 166, 0.1)']
                        : ['rgba(30, 27, 38, 0.8)', 'rgba(30, 27, 38, 0.6)']}
                      className={`border ${
                        isSelected ? 'border-primary/50' : 'border-primary-light/20'
                      }`}
                      style={{ borderRadius: 16 }}
                    >
                      <TouchableOpacity
                        onPress={() => handleSelectPrompt(prompt)}
                        disabled={isLoading}
                        className="p-4 flex-row items-center justify-between"
                        onPressIn={() => {
                          cardScale.value = withSpring(0.98);
                        }}
                        onPressOut={() => {
                          cardScale.value = withSpring(1);
                        }}
                      >
                        <View className="flex-row items-center flex-1">
                          <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                            isSelected ? 'bg-primary' : 'bg-neutral-dark/80'
                          }`}>
                            <Ionicons 
                              name={prompt.icon as any} 
                              size={20} 
                              color={isSelected ? 'white' : '#9D7EBD'} 
                            />
                          </View>
                          <Text className="text-neutral-light font-montserratMedium flex-1 mr-4">
                            {prompt.question}
                          </Text>
                        </View>
                        <Ionicons 
                          name={isSelected ? "checkmark-circle" : "add-circle-outline"} 
                          size={24} 
                          color={isSelected ? "#50A6A7" : "#9D7EBD"} 
                        />
                      </TouchableOpacity>

                      {isSelected && (
                        <Animated.View 
                          entering={FadeInDown}
                          className="px-4 pb-4"
                        >
                          <View className="bg-neutral-darkest/50 rounded-xl p-3 border border-primary-light/10">
                            <TextInput
                              value={answer}
                              onChangeText={(text) => handleAnswerChange(prompt.id, text)}
                              placeholder="Type your answer..."
                              placeholderTextColor="#686680"
                              multiline
                              className="text-neutral-light min-h-[100] font-montserrat"
                              maxLength={MAX_CHARS}
                              style={{ textAlignVertical: 'top' }}
                            />
                          </View>
                          <View className="flex-row items-center justify-between mt-3">
                            <Text className={`text-sm font-montserratMedium ${
                              isValidAnswer ? 'text-secondary' : 'text-primary-light'
                            }`}>
                              {answer.length}/{MAX_CHARS} characters
                            </Text>
                            {answer.length < MIN_CHARS && (
                              <Text className="text-primary-light text-sm font-montserrat">
                                Need {MIN_CHARS - answer.length} more characters
                              </Text>
                            )}
                          </View>
                        </Animated.View>
                      )}
                    </LinearGradient>
                  </Animated.View>
                );
              })
            )}
          </View>
        </Animated.View>
        <View className="h-24" />
      </ScrollView>

      <Animated.View 
        entering={FadeInDown.delay(300)}
        className="absolute bottom-0 left-0 right-0 p-6 bg-neutral-dark/80 backdrop-blur-md border-t border-primary-light/20 shadow-lg"
      >
        <LinearGradient
          colors={isValidAnswers() ? ['#7D5BA6', '#9D7EBD'] : ['#3E3C47', '#3E3C47']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="rounded-xl overflow-hidden"
        >
          <TouchableOpacity
            onPress={handleNext}
            disabled={!isValidAnswers() || isLoading}
            className="py-4 px-6"
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white ml-2 font-montserratBold">Saving...</Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-center">
                <Text className={`text-center text-lg font-montserratBold ${
                  isValidAnswers() ? 'text-white' : 'text-neutral-medium'
                }`}>
                  {isValidAnswers() ? 'Finish' : `Complete your prompts`}
                </Text>
                {isValidAnswers() && (
                  <Ionicons name="checkmark-circle" size={20} color="white" className="ml-2" />
                )}
              </View>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}
