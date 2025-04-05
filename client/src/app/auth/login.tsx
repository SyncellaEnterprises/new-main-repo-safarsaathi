import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

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

      const success = await signIn(formData.email.trim(), formData.password);
  
      if (success) {
        toast.show("Login successful!", "success");
        router.replace("/(tabs)/home");
      } else {
        toast.show("Login failed. Please check your credentials.", "error");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMessage = "Login failed. Please check your credentials.";
  
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Invalid email or password.";
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
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
        className="flex-1 justify-center px-6 py-8"
      >
        <Animated.Text 
          entering={FadeInUp.delay(300)}
          className="text-3xl font-youngSerif mb-2 text-primary-dark"
        >
          Welcome Back
        </Animated.Text>
        <Animated.Text 
          entering={FadeInUp.delay(400)}
          className="text-neutral-dark mb-8 font-montserratLight text-base"
        >
          Sign in to continue your journey
        </Animated.Text>

        <View className="space-y-5">
          <Animated.View entering={FadeInUp.delay(500)}>
            <Text className="text-neutral-dark mb-2 ml-1 font-montserratMedium text-sm">Email</Text>
            <TextInput
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              className="bg-neutral-lightest px-4 py-3.5 rounded-xl border border-neutral-medium font-montserrat"
              placeholder="your@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
              editable={!isLoading}
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(600)}>
            <Text className="text-neutral-dark mb-2 ml-1 font-montserratMedium text-sm">Password</Text>
            <View className="relative">
              <TextInput
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                className="bg-neutral-lightest px-4 py-3.5 rounded-xl border border-neutral-medium font-montserrat"
                secureTextEntry={!showPassword}
                placeholder="Min. 6 characters"
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-3.5"
                disabled={isLoading}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#7D5BA6"
                />
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>

        <Animated.View 
          entering={FadeInUp.delay(700)}
          className="mt-3"
        >
          <Link href="/auth/forgot-password" className="text-primary-dark text-right font-montserratMedium text-sm">
            Forgot Password?
          </Link>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(800)}>
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className="bg-primary py-4 rounded-xl mt-8 flex-row justify-center items-center shadow-sm"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-neutral-lightest text-base font-montserratBold">Sign In</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(900)}
          className="flex-row justify-center mt-8"
        >
          <Text className="text-neutral-dark font-montserrat">Don't have an account? </Text>
          <Link href="/auth/register" className="text-primary-dark font-montserratBold">
            Sign Up
          </Link>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
