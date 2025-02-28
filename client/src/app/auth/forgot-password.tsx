import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useState } from "react";
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
    <View className="flex-1 bg-white p-6">
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 justify-center"
      >
        <Text className="text-3xl font-bold mb-8 text-center text-purple-600">
          Reset Password
        </Text>

        <Text className="text-gray-600 text-center mb-6">
          Enter your email address and we'll send you a link to reset your password
        </Text>

        <TextInput
          placeholder="Email"
          className="border border-gray-300 p-4 rounded-xl mb-6"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <TouchableOpacity
          onPress={handleResetPassword}
          className="bg-purple-600 py-4 rounded-full"
        >
          <Text className="text-white text-center text-lg font-semibold">
            Send Reset Link
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4"
        >
          <Text className="text-gray-600 text-center">
            Back to Login
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
} 