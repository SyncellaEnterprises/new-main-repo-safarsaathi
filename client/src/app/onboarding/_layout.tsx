import { OnboardingProvider } from '@/src/context/OnboardingContext';
import { Stack } from 'expo-router';
import React from 'react';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
    <Stack screenOptions={{
      headerShown: false,
      gestureEnabled: false
    }}>
      <Stack.Screen name="age" />
      <Stack.Screen name="gender" />
      <Stack.Screen name="photos" />
      <Stack.Screen name="location" />
      <Stack.Screen name="bio" />
      <Stack.Screen name="occupation" />
      <Stack.Screen name="interests" />
      <Stack.Screen name="prompts" />
    </Stack>
    </OnboardingProvider>
  );
} 