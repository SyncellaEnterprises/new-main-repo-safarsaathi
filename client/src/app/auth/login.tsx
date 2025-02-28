import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

// Use localhost for iOS simulator, 10.0.2.2 for Android emulator, or your machine's IP for physical device
const API_URL = __DEV__ 
  ? Platform.select({
    ios: 'http://localhost:5000/api/user',
    android: 'http://10.0.2.2:5000/api/user',
  })
  : 'http://192.168.0.108:5000/api/user';  // Your production API URL

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async () => {
    try {
      setIsSubmitting(true);

      if (!formData.email || !formData.password) {
        toast.show("Please fill in all fields", "error");
        return;
      }

      if (!validateEmail(formData.email)) {
        toast.show("Please enter a valid email", "error");
        return;
      }

      if (formData.password.length < 6) {
        toast.show("Password must be at least 6 characters", "error");
        return;
      }

      console.log('Attempting login with:', {
        email: formData.email.trim()
      });


      const response = await axios.post(`${API_URL}/login`, {
        email: formData.email.trim(),
        password: formData.password
      }, {
        headers: {
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${accessToken}`
        },
        timeout: 10000 // 10 second timeout
      });

      console.log('Login response:', response.data);

      if (response.data.access_token && response.data.user) {
        await signIn(response.data.access_token, response.data.user);
        toast.show("Login successful!", "success");
        router.replace("/(tabs)/home");
      } else {
        console.error('Invalid response structure:', response.data);
        toast.show("Server response missing required data", "error");
      }
    } catch (error: any) {
      console.error('Login error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });

      let errorMessage = "Login failed. Please check your credentials.";

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (error.response.status === 401) {
          errorMessage = "Invalid email or password.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // The request was made but no response was received
        errorMessage = "Network error. Please check your internet connection.";
      }

      toast.show(errorMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = isSubmitting || authLoading;

  return (
    <View className="flex-1 bg-neutral-light">
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 justify-center p-6"
      >
        <Animated.Text 
          entering={FadeInUp.delay(300)}
          className="text-4xl font-bold mb-2 text-primary"
        >
          Welcome Back
        </Animated.Text>
        <Animated.Text 
          entering={FadeInUp.delay(400)}
          className="text-neutral-dark mb-10"
        >
          Sign in to continue your journey
        </Animated.Text>

        <View className="space-y-4">
          <Animated.View entering={FadeInUp.delay(500)}>
            <Text className="text-neutral-dark mb-2 ml-1">Email</Text>
            <TextInput
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              className="bg-neutral-lightest px-4 py-3 rounded-xl border border-primary-light"
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!isLoading}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600)}>
            <Text className="text-neutral-dark mb-2 ml-1">Password</Text>
            <View className="relative">
              <TextInput
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                className="bg-neutral-lightest px-4 py-3 rounded-xl border border-primary-light"
                secureTextEntry={!showPassword}
                placeholder="Min. 6 characters"
                editable={!isLoading}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3"
                disabled={isLoading}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#075985"
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        <Animated.View 
          entering={FadeInUp.delay(700)}
          className="mt-2"
        >
          <Link href="/auth/forgot-password" className="text-primary text-right">
            Forgot Password?
          </Link>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(800)}>
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className="bg-primary py-4 rounded-xl mt-8 flex-row justify-center items-center"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-neutral-lightest text-lg font-semibold">Sign In</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(900)}
          className="flex-row justify-center mt-8"
        >
          <Text className="text-neutral-dark">Don't have an account? </Text>
          <Link href="/auth/register" className="text-primary font-semibold">
            Sign Up
          </Link>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
