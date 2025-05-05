import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, Image, StatusBar } from "react-native";
import { Link, useRouter } from "expo-router";
import Animated, { FadeIn } from "react-native-reanimated";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import IMAGES from "../../constants/images";

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
  const [errorMessage, setErrorMessage] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleLogin = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage("");
  
      if (!formData.email || !formData.password) {
        setErrorMessage("Please fill in all fields");
        return;
      }
  
      if (!validateEmail(formData.email)) {
        setErrorMessage("Please enter a valid email");
        return;
      }
  
      if (formData.password.length < 6) {
        setErrorMessage("Password must be at least 6 characters");
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
        setErrorMessage("Login failed. Please check your credentials.");
      }
    } catch (error: any) {
      console.error('Login error:', error);
      let errorMsg = "Login failed. Please check your credentials.";
  
      if (error.response) {
        if (error.response.status === 401) {
          errorMsg = "Invalid email or password.";
        } else if (error.response.data?.message) {
          errorMsg = error.response.data.message;
        }
      } else if (error.request) {
        errorMsg = "Network error. Please check your internet connection.";
      }
  
      setErrorMessage(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const isLoading = isSubmitting || authLoading;

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <Animated.View 
        entering={FadeIn.duration(600)} 
        className="flex-1 px-6 pt-10 pb-4"
      >
        {/* Logo */}
        <View className="items-center mb-12">
          <Image 
            source={IMAGES.safarsaathi}
            className="w-24 h-24"
            resizeMode="contain"
          />
        </View>
        
        {/* Welcome Text */}
        <View className="items-center mb-8">
          <Text className="text-3xl font-montserratBold text-accent-500 mb-2">
            Welcome Back!
          </Text>
          <Text className="text-base text-neutral-dark text-center">
            Log in to continue your journey.
          </Text>
        </View>
        
        {/* Form Fields */}
        <View className="space-y-5">
          {/* Email Field */}
          <View>
            <Text className="text-sm font-montserratMedium mb-2 ml-1 text-neutral-dark">
              Email Address
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-4 z-10">
                <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
              </View>
              <TextInput
                value={formData.email}
                onChangeText={(text) => setFormData({ ...formData, email: text })}
                className="bg-neutral-lightest pl-11 pr-4 py-4 rounded-lg border border-neutral-light"
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
              />
            </View>
          </View>

          {/* Password Field */}
          <View>
            <Text className="text-sm font-montserratMedium mb-2 ml-1 text-neutral-dark">
              Password
            </Text>
            <View className="relative">
              <View className="absolute left-4 top-4 z-10">
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
              </View>
              <TextInput
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                className="bg-neutral-lightest pl-11 pr-12 py-4 rounded-lg border border-neutral-light"
                secureTextEntry={!showPassword}
                placeholder="Enter your password"
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-4 z-10"
                disabled={isLoading}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password Link */}
          <View className="items-end">
            <Link href="/auth/forgot-password">
              <Text className="text-accent-500 text-sm font-montserratMedium">
                Forgot Password?
              </Text>
            </Link>
          </View>
        </View>

        {/* Sign In Button */}
        <View className="mt-8">
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading}
            className="bg-accent-500 py-4 rounded-lg shadow-button"
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-montserratBold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View className="bg-red-100 border border-red-300 rounded-lg p-3 mt-6">
            <Text className="text-red-600 text-sm font-montserratMedium text-center">
              Ensure your credentials are correct to access your account.
            </Text>
          </View>
        ) : null}

        {/* Bottom Indicator Line */}
        <View className="flex-1 justify-end items-center w-full">
          <View className="w-10 h-1 bg-neutral-medium rounded-full opacity-50"></View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}