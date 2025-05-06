import { Stack } from "expo-router";
import React from "react";
export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#f8fafc" },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="verification" />
      <Stack.Screen name="verification-camera" options={{ animation: "slide_from_bottom" }} />
    </Stack>
  );
} 