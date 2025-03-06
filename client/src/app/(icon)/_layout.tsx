import { Stack } from "expo-router";
import React from "react";
export default function IconLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#1a237e' }
      }}
    >
      <Stack.Screen name="settings" />
      <Stack.Screen name="safar-points" />
      <Stack.Screen name="spin-wheel" />
      <Stack.Screen name="trip-calendar" />
      <Stack.Screen name="help" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="connections" />
      <Stack.Screen name="custom-trip" />
    </Stack>
  );
}
