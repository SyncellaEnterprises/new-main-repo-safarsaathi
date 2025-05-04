import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, SafeAreaView, Image, StatusBar } from "react-native";
import { Link, useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import IMAGES from "@/src/constants/images";

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleRegister = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage("");

      if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
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

      if (formData.password !== formData.confirmPassword) {
        setErrorMessage("Passwords do not match");
        return;
      }

      const success = await signUp(formData.name.trim(), formData.email.trim(), formData.password);

      if (success) {
        toast.show("Registration successful!", "success");
        router.replace("/onboarding/age");
      } else {
        setErrorMessage("Registration failed. Please try again.");
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMsg = "Registration failed. Please try again.";

      if (error.response) {
        if (error.response.status === 409) {
          errorMsg = "Email already exists.";
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
      
      <Animated.ScrollView 
        className="flex-1 px-6 py-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center mb-8">
          <Image 
            source={IMAGES.safarsaathi}
            className="w-40 h-10 mb-8"
            resizeMode="contain"
          />
          
          <Text className="text-2xl font-bold text-neutral-darkest mb-2">
            Join SafarSaathi
          </Text>
          <Text className="text-base text-neutral-dark">
            Let's set up your profile.
          </Text>
        </View>
        
        <View className="space-y-4 mt-4">
          <View>
            <Text className="text-sm font-medium mb-2 ml-1">Full Name</Text>
            <TextInput
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              className="bg-neutral-lightest px-4 py-4 rounded-lg border border-neutral-medium"
              placeholder="Enter your full name"
              placeholderTextColor="#9CA3AF"
              editable={!isLoading}
            />
          </View>

          <View>
            <Text className="text-sm font-medium mb-2 ml-1">Email Address</Text>
            <TextInput
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              className="bg-neutral-lightest px-4 py-4 rounded-lg border border-neutral-medium"
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
              editable={!isLoading}
            />
          </View>

          <View>
            <Text className="text-sm font-medium mb-2 ml-1">Password</Text>
            <View className="relative">
              <TextInput
                value={formData.password}
                onChangeText={(text) => setFormData({ ...formData, password: text })}
                className="bg-neutral-lightest pl-4 pr-12 py-4 rounded-lg border border-neutral-medium"
                secureTextEntry={!showPassword}
                placeholder="Create password"
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

          <View>
            <Text className="text-sm font-medium mb-2 ml-1">Confirm Password</Text>
            <View className="relative">
              <TextInput
                value={formData.confirmPassword}
                onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                className="bg-neutral-lightest pl-4 pr-12 py-4 rounded-lg border border-neutral-medium"
                secureTextEntry={!showConfirmPassword}
                placeholder="Confirm your password"
                placeholderTextColor="#9CA3AF"
                editable={!isLoading}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-4 z-10"
                disabled={isLoading}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View className="flex-row items-center mt-2">
            <Ionicons name="information-circle-outline" size={20} color="#4DB6AC" />
            <Text className="text-accent ml-2 text-xs">
              Use a strong password to keep your account secure.
            </Text>
          </View>
        </View>

        {errorMessage ? (
          <View className="bg-red-100 border border-red-300 rounded-lg p-3 mt-6">
            <Text className="text-red-600 text-sm">{errorMessage}</Text>
          </View>
        ) : null}

        <Animated.View entering={FadeInUp.delay(400)}>
          <TouchableOpacity
            onPress={handleRegister}
            disabled={isLoading}
            className="mt-8 bg-gradient-to-r from-accent-400 to-accent py-4 rounded-lg"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-bold">Create Account</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <View className="py-8">
          <View className="flex-row justify-center">
            <Text className="text-neutral-dark">Already have an account? </Text>
            <Link href="/auth/login">
              <Text className="text-accent font-bold">Sign In</Text>
            </Link>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
