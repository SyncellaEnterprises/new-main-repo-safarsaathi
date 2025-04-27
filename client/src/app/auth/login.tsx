import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ImageBackground } from "react-native";
import { Link, useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

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
    <View className="flex-1">
      <ImageBackground 
        source={{ uri: "https://images.unsplash.com/photo-1488085061387-422e29b40080?q=80&w=1431&auto=format&fit=crop" }}
        className="flex-1"
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(255,143,177,0.3)', 'rgba(255,107,107,0.95)']}
          className="flex-1"
        >
          <Animated.ScrollView 
            entering={FadeInDown.duration(1000).springify()}
            className="flex-1 px-6 py-8"
            showsVerticalScrollIndicator={false}
          >
            <View className="h-16" />
  
            <View className="bg-white/90 rounded-3xl p-8 shadow-card backdrop-blur-lg">
              <Animated.View 
                entering={FadeInUp.delay(300)}
                className="items-center mb-8"
              >
                <LinearGradient
                  colors={['#FF8FB1', '#FF6B6B']}
                  className="w-16 h-16 rounded-full items-center justify-center mb-4"
                >
                  <Ionicons name="person-outline" size={32} color="white" />
                </LinearGradient>
                <Text className="text-3xl font-youngSerif mb-2 text-primary">
                  Welcome Back
                </Text>
                <Text className="text-neutral-dark mb-4 font-montserratLight text-base text-center">
                  Sign in to continue your journey
                </Text>
              </Animated.View>
  
              <View className="space-y-5">
                <Animated.View entering={FadeInUp.delay(500)}>
                  <Text className="text-neutral-dark mb-2 ml-1 font-montserratMedium text-sm">Email</Text>
                  <View className="relative">
                    <View className="absolute left-3.5 top-3.5 z-10">
                      <Ionicons name="mail-outline" size={22} color="#FF8FB1" />
                    </View>
                    <TextInput
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      className="bg-neutral-lightest pl-11 pr-4 py-3.5 rounded-xl border border-neutral-medium font-montserrat"
                      placeholder="your@email.com"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      placeholderTextColor="#9CA3AF"
                      editable={!isLoading}
                    />
                  </View>
                </Animated.View>
  
                <Animated.View entering={FadeInUp.delay(600)}>
                  <Text className="text-neutral-dark mb-2 ml-1 font-montserratMedium text-sm">Password</Text>
                  <View className="relative">
                    <View className="absolute left-3.5 top-3.5 z-10">
                      <Ionicons name="lock-closed-outline" size={22} color="#FF8FB1" />
                    </View>
                    <TextInput
                      value={formData.password}
                      onChangeText={(text) => setFormData({ ...formData, password: text })}
                      className="bg-neutral-lightest pl-11 pr-12 py-3.5 rounded-xl border border-neutral-medium font-montserrat"
                      secureTextEntry={!showPassword}
                      placeholder="Min. 6 characters"
                      placeholderTextColor="#9CA3AF"
                      editable={!isLoading}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-3.5 z-10"
                      disabled={isLoading}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off" : "eye"} 
                        size={22} 
                        color="#FF8FB1"
                      />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </View>
  
              <Animated.View 
                entering={FadeInUp.delay(700)}
                className="mt-3"
              >
                <Link href="/auth/forgot-password" className="text-primary text-right font-montserratMedium text-sm">
                  Forgot Password?
                </Link>
              </Animated.View>
  
              <Animated.View entering={FadeInUp.delay(800)}>
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading}
                  className="mt-8"
                >
                  <LinearGradient
                    colors={['#FF8FB1', '#FF6B6B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="py-4 rounded-xl flex-row justify-center items-center shadow-button"
                  >
                    {isLoading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Ionicons name="log-in-outline" size={22} color="white" />
                        <Text className="text-white text-base font-montserratBold ml-2">Sign In</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>
  
              <Animated.View 
                entering={FadeInUp.delay(900)}
                className="flex-row justify-center mt-8"
              >
                <Text className="text-neutral-dark font-montserrat">Don't have an account? </Text>
                <Link href="/auth/register" className="text-primary font-montserratBold">
                  Sign Up
                </Link>
              </Animated.View>
            </View>
            
            <TouchableOpacity
              onPress={() => router.back()}
              className="mt-6 mb-4 self-center"
            >
              <View className="flex-row items-center">
                <Ionicons name="arrow-back-circle" size={24} color="white" />
                <Text className="text-white ml-2 font-montserratMedium">Back</Text>
              </View>
            </TouchableOpacity>
          </Animated.ScrollView>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}
