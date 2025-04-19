import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInDown,
  FadeIn,
  SlideInRight,
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  interpolate
} from 'react-native-reanimated';
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from 'expo-blur';

interface Prompt {
  id: string;
  question: string;
  placeholder: string;
  icon: string;
}

interface SelectedPrompt {
  id: string;
  answer: string;
}

const PROMPT_OPTIONS: Prompt[] = [
  {
    id: "childhood",
    question: "What's your favorite childhood memory?",
    placeholder: "Share a heartwarming story from your childhood...",
    icon: "happy"
  },
  {
    id: "adventure",
    question: "What's the most adventurous thing you've done?",
    placeholder: "Tell us about your boldest adventure...",
    icon: "compass"
  },
  {
    id: "passion",
    question: "What are you passionate about?",
    placeholder: "Share what drives you and makes you excited...",
    icon: "flame"
  },
  {
    id: "dream",
    question: "What's your biggest dream in life?",
    placeholder: "Tell us about your aspirations...",
    icon: "star"
  }
];

const MAX_ANSWER_LENGTH = 200;

export default function PromptsScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updatePrompts, isLoading } = useOnboarding();
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [answer, setAnswer] = useState('');
  const [isSkeletonVisible, setIsSkeletonVisible] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const scale = useSharedValue(1);
  const scrollY = useSharedValue(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSkeletonVisible(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, 100],
          [0, -20],
          'clamp'
        ),
      },
    ],
    opacity: interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.9],
      'clamp'
    ),
  }));

  const handleSelect = (promptId: string) => {
    setSelectedPrompt(promptId);
    setSubmitError(null);
    scale.value = withSpring(1.02, {}, () => {
      scale.value = withSpring(1);
    });
  };

  const handleNext = async () => {
    if (!selectedPrompt) {
      setSubmitError("Please select a prompt");
      toast.show("Please select a prompt", "error");
      return;
    }

    if (!answer.trim()) {
      setSubmitError("Please write your answer");
      toast.show("Please write your answer", "error");
      return;
    }

    try {
      setSubmitError(null);
      const success = await updatePrompts([{ question: selectedPrompt, answer: answer.trim() }]);
      if (success) {
        router.push('/onboarding/photos');
      } else {
        setSubmitError("Failed to save prompt");
        toast.show("Failed to save prompt. Please try again.", "error");
      }
    } catch (error) {
      console.error('Prompt update error:', error);
      setSubmitError("An error occurred");
      toast.show("An error occurred. Please try again.", "error");
    }
  };

  const renderSkeletons = () => (
    <View className="space-y-4">
      {[1, 2, 3, 4].map((index) => (
        <Animated.View
          key={`skeleton-${index}`}
          entering={FadeIn.delay(index * 100)}
          className="bg-neutral-dark/30 rounded-2xl overflow-hidden"
          style={{ height: 120 }}
        >
          <LinearGradient
            colors={['rgba(255, 107, 107, 0.1)', 'rgba(255, 142, 142, 0.2)', 'rgba(255, 107, 107, 0.1)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="w-full h-full"
          />
        </Animated.View>
      ))}
    </View>
  );

  const selectedPromptData = PROMPT_OPTIONS.find(p => p.id === selectedPrompt);

  return (
    <View className="flex-1 bg-neutral-darkest">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          scrollY.value = e.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
      >
        <Animated.View 
          style={headerStyle}
          className="px-6 pt-6"
        >
          {/* Romantic Journey Progress */}
          <View className="flex-row items-center mb-4">
            <View className="w-8 h-8 rounded-full bg-[#FF6B6B]/20 items-center justify-center">
              <Ionicons name="heart" size={16} color="#FF6B6B" />
            </View>
            <View className="flex-1 h-1 bg-neutral-dark/50 rounded-full ml-2">
              <View className="w-4/5 h-full bg-gradient-to-r from-[#FF6B6B] to-[#FF8E8E] rounded-full" />
            </View>
          </View>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-4xl font-youngSerif mb-3 text-white">
              Share Your Story
            </Text>
            <Text className="text-lg text-neutral-light font-montserrat leading-relaxed">
              Choose a prompt and let potential matches know what makes you unique
            </Text>
            
            {submitError && (
              <Animated.View 
                entering={SlideInRight}
                className="mt-4 bg-red-900/30 border border-red-500/30 rounded-xl p-4 flex-row items-center"
              >
                <Ionicons name="alert-circle" size={20} color="#f87171" />
                <Text className="text-red-400 ml-2 font-montserrat">{submitError}</Text>
              </Animated.View>
            )}
          </View>

          {/* Prompt Options */}
          {isSkeletonVisible ? (
            renderSkeletons()
          ) : (
            <View className="space-y-4">
              {PROMPT_OPTIONS.map((prompt, index) => (
                <Animated.View
                  key={prompt.id}
                  entering={FadeInDown.delay(index * 100)}
                  style={[
                    { transform: [{ scale: selectedPrompt === prompt.id ? scale : 1 }] }
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => handleSelect(prompt.id)}
                    disabled={isLoading}
                    className={`rounded-2xl overflow-hidden ${
                      selectedPrompt === prompt.id ? 'border-2 border-[#FF6B6B]' : ''
                    }`}
                  >
                    <BlurView intensity={20} tint="dark">
                      <LinearGradient
                        colors={
                          selectedPrompt === prompt.id
                            ? ['rgba(255, 107, 107, 0.2)', 'rgba(255, 142, 142, 0.1)']
                            : ['rgba(255, 107, 107, 0.1)', 'rgba(255, 142, 142, 0.05)']
                        }
                        className="p-5"
                      >
                        <View className="flex-row items-center mb-3">
                          <View className={`w-12 h-12 rounded-full items-center justify-center ${
                            selectedPrompt === prompt.id ? 'bg-[#FF6B6B]' : 'bg-[#FF6B6B]/20'
                          }`}>
                            <Ionicons 
                              name={prompt.icon as any} 
                              size={24} 
                              color={selectedPrompt === prompt.id ? 'white' : '#FF6B6B'} 
                            />
                          </View>
                          <Text className={`ml-4 text-xl flex-1 ${
                            selectedPrompt === prompt.id 
                              ? 'text-white font-montserratBold' 
                              : 'text-neutral-light font-montserrat'
                          }`}>
                            {prompt.question}
                          </Text>
                          {selectedPrompt === prompt.id && (
                            <View className="w-6 h-6 rounded-full bg-[#FF6B6B] items-center justify-center">
                              <Ionicons name="checkmark" size={16} color="white" />
                            </View>
                          )}
                        </View>
                        
                        {selectedPrompt === prompt.id && (
                          <View className="mt-2">
                            <TextInput
                              value={answer}
                              onChangeText={setAnswer}
                              placeholder={prompt.placeholder}
                              placeholderTextColor="rgba(255, 255, 255, 0.5)"
                              multiline
                              className="bg-neutral-dark/30 rounded-xl p-4 text-white font-montserrat min-h-[100px]"
                              maxLength={MAX_ANSWER_LENGTH}
                            />
                            <Text className="text-neutral-light text-right mt-2 font-montserrat">
                              {answer.length}/{MAX_ANSWER_LENGTH}
                            </Text>
                          </View>
                        )}
                      </LinearGradient>
                    </BlurView>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          )}

          {/* Pro Tips */}
          <BlurView intensity={20} tint="dark" className="rounded-2xl mt-8 mb-6 overflow-hidden">
            <LinearGradient
              colors={['rgba(255, 107, 107, 0.1)', 'rgba(255, 142, 142, 0.05)']}
              className="p-5 border border-[#FF6B6B]/20"
            >
              <View className="flex-row items-start">
                <View className="w-12 h-12 rounded-full bg-[#FF6B6B]/20 items-center justify-center mr-4">
                  <Ionicons name="sparkles" size={24} color="#FF6B6B" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-montserratBold text-lg mb-2">Pro Tips</Text>
                  <Text className="text-neutral-light font-montserrat leading-relaxed">
                    • Be authentic and show your personality{'\n'}
                    • Share specific stories or experiences{'\n'}
                    • Keep it positive and engaging
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
        <View className="h-32" />
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View 
        entering={FadeInDown.delay(300)}
        className="absolute bottom-0 left-0 right-0 p-6 bg-neutral-darkest/80 backdrop-blur-xl border-t border-white/5"
      >
        <LinearGradient
          colors={selectedPrompt && answer.trim() 
            ? ['#FF6B6B', '#FF8E8E']
            : ['rgba(30, 27, 38, 0.8)', 'rgba(30, 27, 38, 0.6)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="rounded-xl overflow-hidden"
        >
          <TouchableOpacity
            onPress={handleNext}
            disabled={!selectedPrompt || !answer.trim() || isLoading}
            className="py-4 px-6"
          >
            {isLoading ? (
              <View className="flex-row items-center justify-center">
                <ActivityIndicator color="white" size="small" />
                <Text className="text-white ml-2 font-montserratBold">Saving your story...</Text>
              </View>
            ) : (
              <View className="flex-row items-center justify-center">
                <Text className={`text-center text-lg font-montserratBold ${
                  selectedPrompt && answer.trim() ? 'text-white' : 'text-neutral-medium'
                }`}>
                  {selectedPrompt && answer.trim() ? 'Continue Your Journey' : 'Select & Answer a Prompt'}
                </Text>
                {selectedPrompt && answer.trim() && (
                  <Ionicons name="arrow-forward" size={20} color="white" className="ml-2" />
                )}
              </View>
            )}
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}