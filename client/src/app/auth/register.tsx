import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Platform } from "react-native";
import { Link, useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, isLoading } = useAuth();
  const toast = useToast();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateUsername = (username: string) => {
    return /^[a-zA-Z0-9_]{3,20}$/.test(username);
  };

  const handleRegister = async () => {
    try {
      setIsSubmitting(true);

      // Validation checks
      if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
        toast.show("Please fill in all fields", "error");
        return;
      }

      if (!validateUsername(formData.username)) {
        toast.show("Username must be 3-20 characters long and can only contain letters, numbers, and underscores", "error");
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

      if (formData.password !== formData.confirmPassword) {
        toast.show("Passwords don't match", "error");
        return;
      }

      console.log('Attempting registration with:', {
        username: formData.username.trim(),
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      const success = await signUp(
        formData.username.trim(),
        formData.email.trim(),
        formData.password
      );

      if (success) {
        toast.show("Registration successful!", "success");
        router.replace("/onboarding/age");
      } else {
        toast.show("Registration failed. Please try again.", "error");
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.show(error.response?.data?.message || "Registration failed", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 bg-neutral-light">
      <Animated.ScrollView 
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 p-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="mt-10">
          <Animated.Text 
            entering={FadeInUp.delay(300)}
            className="text-4xl font-bold mb-2 text-primary"
          >
            Create Account
          </Animated.Text>
          <Animated.Text 
            entering={FadeInUp.delay(400)}
            className="text-neutral-dark mb-10"
          >
            Start your travel journey today
          </Animated.Text>

          <View className="space-y-4">
            {/* Username Input */}
            <Animated.View entering={FadeInUp.delay(500)}>
              <Text className="text-neutral-dark mb-2 ml-1">Username</Text>
              <TextInput
                value={formData.username}
                onChangeText={(text) => setFormData({ ...formData, username: text })}
                className="bg-neutral-lightest px-4 py-3 rounded-xl border border-primary-light"
                placeholder="johndoe123"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </Animated.View>

            {/* Email Input */}
            <Animated.View entering={FadeInUp.delay(600)}>
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

            {/* Password Input */}
            <Animated.View entering={FadeInUp.delay(700)}>
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

            {/* Confirm Password Input */}
            <Animated.View entering={FadeInUp.delay(800)}>
              <Text className="text-neutral-dark mb-2 ml-1">Confirm Password</Text>
              <View className="relative">
                <TextInput
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                  className="bg-neutral-lightest px-4 py-3 rounded-xl border border-primary-light"
                  secureTextEntry={!showConfirmPassword}
                  placeholder="Confirm your password"
                  editable={!isLoading}
                />
                <TouchableOpacity 
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-3"
                  disabled={isLoading}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off" : "eye"} 
                    size={24} 
                    color="#075985"
                  />
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>

          <Animated.View entering={FadeInUp.delay(900)}>
            <TouchableOpacity
              onPress={handleRegister}
              disabled={isLoading}
              className="bg-primary py-4 rounded-xl mt-8 flex-row justify-center items-center"
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-neutral-lightest text-lg font-semibold">Create Account</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <Animated.View 
            entering={FadeInUp.delay(1000)}
            className="flex-row justify-center mt-8 mb-4"
          >
            <Text className="text-neutral-dark">Already have an account? </Text>
            <Link href="/auth/login" className="text-primary font-semibold">
              Sign In
            </Link>
          </Animated.View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}
