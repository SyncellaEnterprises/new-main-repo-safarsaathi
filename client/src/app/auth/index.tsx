import { View, Text, Image } from "react-native";
import { Link } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import IMAGES from "@/src/constants/images";
import React from "react";


export default function AuthScreen() {
  return (
    <View className="flex-1 bg-neutral-light">
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 justify-center items-center p-6"
      >
        <Image 
          source={IMAGES.logo} 
          className="w-42 h-42 mb-10"
        />
        
        <Link href="/auth/login">
          <Animated.View 
            entering={FadeInDown.delay(200).springify()}
            className="w-full"
          >
            <Text className="bg-primary text-neutral-lightest text-center py-4 rounded-full text-lg font-semibold mb-4">
              Login
            </Text>
          </Animated.View>
        </Link>

        <Link href="/auth/register" >
          <Animated.View 
            entering={FadeInDown.delay(400).springify()}
            className="w-full"
          >
          <Text className="bg-neutral-lightest border-2 border-primary text-primary text-center py-4 rounded-full text-lg font-semibold mb-4">
              Register
            </Text>
          </Animated.View>
        </Link>

        <Link href="/auth/forgot-password" >
          <Animated.View 
            entering={FadeInDown.delay(600).springify()}
            className="w-full"
          >
            <Text className="text-neutral-dark text-center">
              Forgot Password?
            </Text>
          </Animated.View>
        </Link>
      </Animated.View>
    </View>
  );
} 