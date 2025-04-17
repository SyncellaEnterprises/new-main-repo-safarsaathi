import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ImageBackground } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useToast } from "../../context/ToastContext";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      toast.show("Please enter your email", "error");
      return;
    }

    if (!validateEmail(email)) {
      toast.show("Please enter a valid email", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post('https://authentication-4-bhm5.onrender.com/auth/forgot-password', {
        email: email
      });
      
      toast.show("Reset link sent to your email", "success");
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to send reset link";
      toast.show(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1">
      <ImageBackground 
        source={{ uri: "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?q=80&w=1374&auto=format&fit=crop" }}
        className="flex-1"
        resizeMode="cover"
      >
        <View className="flex-1 bg-black/30 bg-pattern">
          <Animated.View 
            entering={FadeInDown.duration(1000).springify()}
            className="flex-1 justify-center px-6 py-8"
          >
            <View className="bg-white/90 rounded-3xl p-8 shadow-card">
              <View className="items-center mb-6">
                <View className="bg-secondary/10 p-4 rounded-full mb-4">
                  <Ionicons name="key-outline" size={40} color="#3D90E3" />
                </View>
                <Text className="text-3xl font-youngSerif mb-3 text-center text-primary">
                  Reset Password
                </Text>
                <Text className="text-neutral-dark text-center font-montserrat">
                  Enter your email address and we'll send you a link to reset your password
                </Text>
              </View>

              <View className="mb-6">
                <Text className="text-neutral-dark mb-2 ml-1 font-montserratMedium text-sm">Email</Text>
                <View className="relative">
                  <View className="absolute left-3.5 top-3.5 z-10">
                    <Ionicons name="mail-outline" size={22} color="#3D90E3" />
                  </View>
                  <TextInput
                    placeholder="your@email.com"
                    className="bg-neutral-lightest pl-11 pr-4 py-3.5 rounded-xl border border-neutral-medium font-montserrat"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#9CA3AF"
                    editable={!isSubmitting}
                  />
                </View>
              </View>

              <TouchableOpacity
                onPress={handleResetPassword}
                disabled={isSubmitting}
                className="bg-gradient-travel py-4 rounded-xl shadow-button"
              >
                <View className="flex-row items-center justify-center">
                  {isSubmitting ? (
                    <View className="mr-2">
                      <Animated.View entering={FadeInDown.duration(400).springify()}>
                        <Ionicons name="sync" size={20} color="white" className="animate-spin" />
                      </Animated.View>
                    </View>
                  ) : (
                    <Ionicons name="send-outline" size={20} color="white" className="mr-2" />
                  )}
                  <Text className="text-neutral-lightest text-center font-montserratBold ml-2">
                    {isSubmitting ? "Sending..." : "Send Reset Link"}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.back()}
                className="mt-6"
              >
                <View className="flex-row justify-center items-center">
                  <Ionicons name="arrow-back" size={20} color="#3D90E3" />
                  <Text className="text-secondary text-center font-montserratMedium ml-2">
                    Back to Login
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
}

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}; 