import React from "react";
import { View, Text, Image, SafeAreaView, StatusBar, TouchableOpacity } from "react-native";
import { Link, useRouter } from "expo-router";
import Animated, { FadeInDown } from "react-native-reanimated";
import IMAGES from "@/src/constants/images";

export default function AuthScreen() {
  const router = useRouter();
  
  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View className="flex-1 items-center px-6">
        {/* Logo - Centered at the top */}
        <Animated.View 
          entering={FadeInDown.duration(800).springify()}
          className="items-center mt-16 mb-12"
        >
          <Image 
            source={IMAGES.safarsaathi}
            className="w-40 h-40"
            resizeMode="contain"
          />
        </Animated.View>

        {/* Welcome Text */}
        <View className="items-center w-full">
          <Animated.Text 
            entering={FadeInDown.delay(300).duration(800).springify()}
            className="text-3xl font-black text-center text-neutral-darkest"
          >
            Welcome to
          </Animated.Text>
          <Animated.Text 
            entering={FadeInDown.delay(400).duration(800).springify()}
            className="text-3xl font-black text-center text-neutral-darkest mt-1 mb-4"
          >
            SafarSaathi
          </Animated.Text>
          <Animated.Text 
            entering={FadeInDown.delay(500).duration(800).springify()}
            className="text-base text-center text-neutral-dark/70 font-montserratLight"
          >
            Find your perfect travel companion and...
          </Animated.Text>
        </View>

        {/* Action Buttons - Centered in the middle of screen */}
        <View className="w-full absolute top-1/3 mt-28">
          <TouchableOpacity 
            onPress={() => router.push("/auth/login")}
            className="w-full mb-5"
            activeOpacity={0.8}
          >
            <Animated.View 
              entering={FadeInDown.delay(700).duration(800).springify()}
              className="w-full"
            >
              <View className="bg-primary w-full py-4 rounded-xl shadow-button">
                <Text className="text-white text-center font-montserratBold text-base">
                  Sign In
                </Text>
              </View>
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => router.push("/auth/register")}
            className="w-full"
            activeOpacity={0.8}
          >
            <Animated.View 
              entering={FadeInDown.delay(800).duration(800).springify()}
              className="w-full"
            >
              <View className="border border-primary w-full py-4 rounded-xl">
                <Text className="text-primary text-center font-montserratBold text-base">
                  Create Account
                </Text>
              </View>
            </Animated.View>
          </TouchableOpacity>

          {/* Footer Text - Positioned below Create Account button */}
          <Animated.Text 
            entering={FadeInDown.delay(900).duration(800).springify()}
            className="text-sm text-neutral-dark/70 text-center mt-16 font-montserratLight"
          >
            Your adventure begins here.
          </Animated.Text>
        </View>
      </View>
    </SafeAreaView>
  );
} 