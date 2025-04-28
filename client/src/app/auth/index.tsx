import React from "react";
import { View, Text, Image, ImageBackground, Dimensions } from "react-native";
import { Link } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import IMAGES from "@/src/constants/images";

const { width } = Dimensions.get('window');
const LOGO_SIZE = width * 0.35; // 35% of screen width

export default function AuthScreen() {
  return (
    <View className="flex-1">
      <ImageBackground 
        source={IMAGES.patternBg}
        className="flex-1"
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(255,107,107,0.3)', 'rgba(255,143,177,0.9)']}
          className="flex-1"
        >
          <Animated.View 
            entering={FadeIn.duration(1000)}
            className="flex-1 justify-between items-center px-8 py-12"
          >
            <View />

            <Animated.View 
              entering={FadeInDown.duration(1200).springify()}
              className="items-center"
            >
              <View className="bg-white/20 rounded-full p-5 mb-6">
                <Image 
                  source={IMAGES.safarsaathi}
                  style={{ width: LOGO_SIZE, height: LOGO_SIZE }}
                  resizeMode="contain"
                />
              </View>
            
            </Animated.View>
            
            <View className="w-full space-y-4">
              <Link href="/auth/login" className="w-full">
                <Animated.View 
                  entering={FadeInDown.delay(200).springify()}
                  className="w-full"
                >
                  <LinearGradient
                    colors={['#FF8FB1', '#FF6B6B']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="rounded-xl shadow-button overflow-hidden"
                  >
                    <View className="flex-row items-center justify-center py-4 px-6">
                      <Ionicons name="log-in-outline" size={22} color="white" />
                      <Text className="text-white text-center ml-2 text-base font-montserratBold">
                        Sign In
                      </Text>
                    </View>
                  </LinearGradient>
                </Animated.View>
              </Link>

              <Link href="/auth/register" className="w-full">
                <Animated.View 
                  entering={FadeInDown.delay(400).springify()}
                  className="w-full"
                >
                  <View className="bg-white/90 border-2 border-primary flex-row items-center justify-center py-4 px-6 rounded-xl shadow-button">
                    <Ionicons name="person-add-outline" size={22} color="#FF6B6B" />
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
        </LinearGradient>
      </ImageBackground>
    </View>
  );
} 