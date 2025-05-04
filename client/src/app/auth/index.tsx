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
      
      <View className="flex-1 items-center justify-between px-8 py-12">
        {/* Logo - Centered with animation */}
        <Animated.View 
          entering={FadeInDown.duration(800).springify()}
          className="items-center"
        >
          <Image 
            source={IMAGES.safarsaathi}
            className="w-48 h-48"
            resizeMode="contain"
          />
        </Animated.View>

        {/* Welcome Text */}
        <View className="items-center">
          <Animated.Text 
            entering={FadeInDown.delay(300).duration(800).springify()}
            className="text-3xl font-montserratBold text-center text-neutral-darkest mb-3"
          >
            Welcome to
          </Animated.Text>
          <Animated.Text 
            entering={FadeInDown.delay(400).duration(800).springify()}
            className="text-3xl font-montserratBold text-center text-neutral-darkest mb-6"
          >
            SafarSaathi
          </Animated.Text>
          <Animated.Text 
            entering={FadeInDown.delay(500).duration(800).springify()}
            className="text-base text-center text-neutral-dark"
          >
            Find your perfect travel companion and
          </Animated.Text>
          <Animated.Text 
            entering={FadeInDown.delay(600).duration(800).springify()}
            className="text-base text-center text-neutral-dark mb-6"
          >
            create unforgettable journeys together.
          </Animated.Text>
        </View>

        {/* Action Buttons */}
        <View className="w-full space-y-4">
          <TouchableOpacity 
            onPress={() => router.push("/auth/login")}
            className="w-full"
            activeOpacity={0.8}
          >
            <Animated.View 
              entering={FadeInDown.delay(700).duration(800).springify()}
              className="w-full"
            >
              <View className="bg-primary w-full py-4 rounded-lg shadow-button">
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
              <View className="border border-primary bg-white w-full py-4 rounded-lg">
                <Text className="text-primary text-center font-montserratBold text-base">
                  Create Account
                </Text>
              </View>
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Footer Text */}
        <Animated.Text 
          entering={FadeInDown.delay(900).duration(800).springify()}
          className="text-sm text-neutral-dark mt-8"
        >
          Your adventure begins here.
        </Animated.Text>
      </View>
    </SafeAreaView>
  );
} 