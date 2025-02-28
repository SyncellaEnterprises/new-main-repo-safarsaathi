import { Stack, Tabs } from "expo-router";
import { ToastProvider } from "../context/ToastContext";
import { AuthProvider } from '../context/AuthContext';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from "react";
import '@/global.css';
// import { ProfileProvider } from "@/context/ProfileContext";
import React from "react";
import { StatusBar } from "react-native";

// Keep splash screen visible while loading resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Add your custom fonts here
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ToastProvider>
        <StatusBar
          backgroundColor="#1a237e"
          barStyle="light-content"
        />
        <Stack screenOptions={{
          headerShown: false,
          animation: 'fade',
          // Enable screen caching
          freezeOnBlur: true,
          // Optimize memory usage
          // unmountOnBlur: true
        }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(icon)" />
          <Stack.Screen name="auth" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="chat/[id]" />
        </Stack>
      </ToastProvider>
    </AuthProvider>
  );
}