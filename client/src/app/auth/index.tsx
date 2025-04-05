import React from "react";
import { View, Text, Image } from "react-native";
import { Link } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import IMAGES from "@/src/constants/images";

export default function AuthScreen() {
  return (
    <View className="flex-1 bg-neutral-light">
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 justify-center items-center px-8 py-10"
      >
        <Image 
          source={IMAGES.logo} 
          className="w-48 h-48 mb-12"
          resizeMode="contain"
        />
        
        <Link href="/auth/login" className="w-full">
          <Animated.View 
            entering={FadeInDown.delay(200).springify()}
            className="w-full"
          >
            <Text className="bg-primary text-neutral-lightest text-center py-4 px-6 rounded-xl text-base font-montserratBold mb-5 shadow-sm">
              Login
            </Text>
          </Animated.View>
        </Link>

        <Link href="/auth/register" className="w-full">
          <Animated.View 
            entering={FadeInDown.delay(400).springify()}
            className="w-full"
          >
            <Text className="bg-neutral-lightest border-2 border-primary text-primary text-center py-4 px-6 rounded-xl text-base font-montserratBold mb-5 shadow-sm">
              Register
            </Text>
          </Animated.View>
        </Link>

        <Link href="/auth/forgot-password">
          <Animated.View 
            entering={FadeInDown.delay(600).springify()}
            className="mt-2"
          >
            <Text className="text-primary-dark text-center font-montserratMedium text-sm">
              Forgot Password?
            </Text>
          </Animated.View>
        </Link>
      </Animated.View>
    </View>
  );
} 