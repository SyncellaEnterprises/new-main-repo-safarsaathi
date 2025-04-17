import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ImageBackground } from "react-native";
import { Link, useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { Ionicons, FontAwesome } from "@expo/vector-icons";

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
    <View className="flex-1">
      <ImageBackground 
        source={{ uri: "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?q=80&w=1470&auto=format&fit=crop" }}
        className="flex-1"
        resizeMode="cover"
      >
        <View className="flex-1 bg-black/30 bg-pattern">
          <Animated.ScrollView 
            entering={FadeInDown.duration(1000).springify()}
            className="flex-1 px-6 py-4"
            showsVerticalScrollIndicator={false}
          >
            <View className="h-12" />
            
            <View className="bg-white/90 rounded-3xl p-8 mb-6 shadow-card">
              <Animated.Text 
                entering={FadeInUp.delay(300)}
                className="text-3xl font-youngSerif mb-2 text-primary"
              >
                Create Account
              </Animated.Text>
              <Animated.Text 
                entering={FadeInUp.delay(400)}
                className="text-neutral-dark mb-8 font-montserratLight text-base"
              >
                Start your journey to find your perfect travel companion
              </Animated.Text>

              <View className="space-y-4">
                {/* Username Input */}
                <Animated.View entering={FadeInUp.delay(500)}>
                  <Text className="text-neutral-dark mb-2 ml-1 font-montserratMedium text-sm">Username</Text>
                  <View className="relative">
                    <View className="absolute left-3.5 top-3.5 z-10">
                      <Ionicons name="person-outline" size={22} color="#3D90E3" />
                    </View>
                    <TextInput
                      value={formData.username}
                      onChangeText={(text) => setFormData({ ...formData, username: text })}
                      className="bg-neutral-lightest pl-11 pr-4 py-3.5 rounded-xl border border-neutral-medium font-montserrat"
                      placeholder="johndoe123"
                      autoCapitalize="none"
                      placeholderTextColor="#9CA3AF"
                      editable={!isLoading}
                    />
                  </View>
                </Animated.View>

                {/* Email Input */}
                <Animated.View entering={FadeInUp.delay(600)}>
                  <Text className="text-neutral-dark mb-2 ml-1 font-montserratMedium text-sm">Email</Text>
                  <View className="relative">
                    <View className="absolute left-3.5 top-3.5 z-10">
                      <Ionicons name="mail-outline" size={22} color="#3D90E3" />
                    </View>
                    <TextInput
                      value={formData.email}
                      onChangeText={(text) => setFormData({ ...formData, email: text })}
                      className="bg-neutral-lightest pl-11 pr-4 py-3.5 rounded-xl border border-neutral-medium font-montserrat"
                      placeholder="your@email.com"
                      keyboardType="email-address"
                      placeholderTextColor="#9CA3AF"
                      autoCapitalize="none"
                      editable={!isLoading}
                    />
                  </View>
                </Animated.View>

                {/* Password Input */}
                <Animated.View entering={FadeInUp.delay(700)}>
                  <Text className="text-neutral-dark mb-2 ml-1 font-montserratMedium text-sm">Password</Text>
                  <View className="relative">
                    <View className="absolute left-3.5 top-3.5 z-10">
                      <Ionicons name="lock-closed-outline" size={22} color="#3D90E3" />
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
                        color="#FF4D6D"
                      />
                    </TouchableOpacity>
                  </View>
                </Animated.View>

                {/* Confirm Password Input */}
                <Animated.View entering={FadeInUp.delay(800)}>
                  <Text className="text-neutral-dark mb-2 ml-1 font-montserratMedium text-sm">Confirm Password</Text>
                  <View className="relative">
                    <View className="absolute left-3.5 top-3.5 z-10">
                      <Ionicons name="shield-checkmark-outline" size={22} color="#3D90E3" />
                    </View>
                    <TextInput
                      value={formData.confirmPassword}
                      onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
                      className="bg-neutral-lightest pl-11 pr-12 py-3.5 rounded-xl border border-neutral-medium font-montserrat"
                      secureTextEntry={!showConfirmPassword}
                      placeholder="Confirm your password"
                      placeholderTextColor="#9CA3AF"
                      editable={!isLoading}
                    />
                    <TouchableOpacity 
                      onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-3.5 z-10"
                      disabled={isLoading}
                    >
                      <Ionicons 
                        name={showConfirmPassword ? "eye-off" : "eye"} 
                        size={22} 
                        color="#FF4D6D"
                      />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              </View>

              <Animated.View entering={FadeInUp.delay(900)}>
                <TouchableOpacity
                  onPress={handleRegister}
                  disabled={isLoading}
                  className="bg-gradient-romance py-4 rounded-xl mt-8 flex-row justify-center items-center shadow-button"
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <FontAwesome name="user-plus" size={18} color="white" />
                      <Text className="text-neutral-lightest text-base font-montserratBold ml-2">Create Account</Text>
                    </>
                  )}
                </TouchableOpacity>
              </Animated.View>

              <Animated.View 
                entering={FadeInUp.delay(1000)}
                className="flex-row justify-center mt-8"
              >
                <Text className="text-neutral-dark font-montserrat">Already have an account? </Text>
                <Link href="/auth/login" className="text-primary font-montserratBold">
                  Sign In
                </Link>
              </Animated.View>
            </View>
            
            <TouchableOpacity
              onPress={() => router.back()}
              className="mb-6 self-center"
            >
              <View className="flex-row items-center">
                <Ionicons name="arrow-back-circle" size={24} color="white" />
                <Text className="text-white ml-2 font-montserratMedium">Back</Text>
              </View>
            </TouchableOpacity>
          </Animated.ScrollView>
        </View>
      </ImageBackground>
    </View>
  );
}
