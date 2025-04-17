import React from "react";
import { View, Text, Image, ImageBackground } from "react-native";
import { Link } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import IMAGES from "@/src/constants/images";

export default function AuthScreen() {
  return (
    <View className="flex-1">
      <ImageBackground 
        source={{ uri: "https://images.unsplash.com/photo-1506869640319-fe1a24fd76dc?q=80&w=1470&auto=format&fit=crop" }}
        className="flex-1"
        resizeMode="cover"
      >
        <View className="flex-1 bg-black/40 bg-pattern">
          <Animated.View 
            entering={FadeIn.duration(1000)}
            className="flex-1 justify-between items-center px-8 py-12"
          >
            <View />

            <Animated.View entering={FadeInDown.duration(1200).springify()}>
              <Image 
                source={IMAGES.logo} 
                className="w-56 h-56"
                resizeMode="contain"
              />
              <Text className="text-white text-center text-3xl font-youngSerif mt-2 mb-1">
                SafarSaathi
              </Text>
              <Text className="text-white/80 text-center text-base font-montserratLight mb-8">
                Find your perfect travel companion
              </Text>
            </Animated.View>
            
            <View className="w-full space-y-4">
              <Link href="/auth/login" className="w-full">
                <Animated.View 
                  entering={FadeInDown.delay(200).springify()}
                  className="w-full"
                >
                  <View className="bg-primary text-neutral-lightest flex-row items-center justify-center py-4 px-6 rounded-xl shadow-button">
                    <Ionicons name="log-in-outline" size={22} color="white" />
                    <Text className="text-neutral-lightest text-center ml-2 text-base font-montserratBold">
                      Sign In
                    </Text>
                  </View>
                </Animated.View>
              </Link>

              <Link href="/auth/register" className="w-full">
                <Animated.View 
                  entering={FadeInDown.delay(400).springify()}
                  className="w-full"
                >
                  <View className="bg-white/90 border-2 border-primary flex-row items-center justify-center py-4 px-6 rounded-xl shadow-button">
                    <Ionicons name="person-add-outline" size={22} color="#FF4D6D" />
                    <Text className="text-primary text-center ml-2 text-base font-montserratBold">
                      Create Account
                    </Text>
                  </View>
                </Animated.View>
              </Link>

              <Link href="/auth/forgot-password">
                <Animated.View 
                  entering={FadeInDown.delay(600).springify()}
                  className="mt-4"
                >
                  <Text className="text-white text-center font-montserratMedium text-sm">
                    Forgot Password?
                  </Text>
                </Animated.View>
              </Link>
            </View>
          </Animated.View>
        </View>
      </ImageBackground>
    </View>
  );
} 