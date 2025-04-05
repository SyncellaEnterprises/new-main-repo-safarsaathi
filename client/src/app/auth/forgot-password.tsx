import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useToast } from "../../context/ToastContext";
import axios from "axios";
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");

  const handleResetPassword = async () => {
    if (!email) {
      toast.show("Please enter your email", "error");
      return;
    }

    if (!validateEmail(email)) {
      toast.show("Please enter a valid email", "error");
      return;
    }

    try {
      await axios.post('https://authentication-4-bhm5.onrender.com/auth/forgot-password', {
        email: email
      });
      
      toast.show("Reset link sent to your email", "success");
      router.push('/auth/login')
      setTimeout(() => {
        router.back();
      }, 2000);
    } catch (error: any) {
      const message = error.response?.data?.message || "Failed to send reset link";
      toast.show(message, "error");
    }
  };

  return (
    <View className="flex-1 bg-neutral-light px-6 py-8">
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 justify-center"
      >
        <Text className="text-3xl font-youngSerif mb-6 text-center text-primary-dark">
          Reset Password
        </Text>

        <Text className="text-neutral-dark text-center mb-8 font-montserrat">
          Enter your email address and we'll send you a link to reset your password
        </Text>

        <View className="mb-6">
          <Text className="text-neutral-dark mb-2 ml-1 font-montserratMedium text-sm">Email</Text>
          <TextInput
            placeholder="your@email.com"
            className="bg-neutral-lightest px-4 py-3.5 rounded-xl border border-neutral-medium font-montserrat"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholderTextColor="#9CA3AF"
          />
        </View>

        <TouchableOpacity
          onPress={handleResetPassword}
          className="bg-primary py-4 rounded-xl shadow-sm"
        >
          <Text className="text-neutral-lightest text-center font-montserratBold">
            Send Reset Link
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-6"
        >
          <Text className="text-primary-dark text-center font-montserratMedium">
            Back to Login
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}; 