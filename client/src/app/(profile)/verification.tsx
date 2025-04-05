import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, SlideInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import React from "react";

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'pending' | 'completed' | 'current';
}

export default function VerificationScreen() {
  const router = useRouter();
  const [steps, setSteps] = useState<VerificationStep[]>([
    {
      id: '1',
      title: 'Video Verification',
      description: 'Take a selfie matching the pose shown',
      icon: 'camera-outline',
      status: 'current'
    },
    {
      id: '2',
      title: 'ID Verification',
      description: 'Upload a government-issued ID',
      icon: 'card-outline',
      status: 'pending'
    },
    {
      id: '3',
      title: 'Profile Review',
      description: 'Our team will review your submission',
      icon: 'shield-checkmark-outline',
      status: 'pending'
    }
  ]);

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
          <Text className="text-lg font-semibold text-[#1a237e]">Get Verified</Text>
          <View style={{ width: 60 }} />
        </View>
      </Animated.View>

      <ScrollView className="flex-1 p-6">
        <View className="bg-indigo-50 p-4 rounded-xl mb-8">
          <View className="flex-row items-center">
            <Ionicons name="shield-checkmark" size={24} color="#1a237e" />
            <View className="ml-3 flex-1">
              <Text className="text-lg font-semibold text-[#1a237e]">
                Why Get Verified?
              </Text>
              <Text className="text-slate-600 mt-1">
                Verified profiles get 2x more matches and unlock premium features
              </Text>
            </View>
          </View>
        </View>

        {steps.map((step, index) => (
          <Animated.View
            key={step.id}
            entering={SlideInRight.delay(index * 200)}
            className={`mb-4 ${
              index !== steps.length - 1 ? 'border-l-2 border-slate-200 pb-6' : ''
            }`}
          >
            <View className={`
              relative flex-row items-center bg-white p-4 rounded-xl
              ${step.status === 'current' ? 'border-2 border-[#1a237e]' : ''}
            `}>
              <View className={`
                w-12 h-12 rounded-full items-center justify-center
                ${step.status === 'completed' ? 'bg-green-100' :
                  step.status === 'current' ? 'bg-indigo-50' : 'bg-slate-100'}
              `}>
                <Ionicons 
                  name={step.status === 'completed' ? 'checkmark' : step.icon as any}
                  size={24}
                  color={step.status === 'completed' ? '#22c55e' :
                    step.status === 'current' ? '#1a237e' : '#94a3b8'}
                />
              </View>
              <View className="ml-4 flex-1">
                <Text className={`font-semibold ${
                  step.status === 'current' ? 'text-[#1a237e]' : 'text-slate-800'
                }`}>
                  {step.title}
                </Text>
                <Text className="text-slate-500">{step.description}</Text>
              </View>
              {step.status === 'current' && (
                <TouchableOpacity 
                  className="bg-[#1a237e] px-4 py-2 rounded-full"
                  onPress={() => {/* Handle step action */}}
                >
                  <Text className="text-white font-semibold">Start</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        ))}

        <View className="mt-6 bg-indigo-50 p-4 rounded-xl">
          <Text className="text-slate-600 text-center">
            Verification usually takes 24-48 hours after submission
          </Text>
        </View>
      </ScrollView>
    </View>
  );
} 