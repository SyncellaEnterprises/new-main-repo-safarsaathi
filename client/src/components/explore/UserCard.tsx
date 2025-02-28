import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

interface UserCardProps {
  user: {
    id: string;
    name: string;
    age: number;
    gender: string;
    bio: string;
    occupation: string;
    lifestyle: string;
    images: string[];
    interests: string[];
    location: string;
    budget: string;
    prompt: string;
    drinking: string;
    smoking: string;
    religion: string;
    height: string;
  };
}

export function UserCard({ user }: UserCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState<string[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scale = useSharedValue(1);

  // Auto-slide images with error handling
  useEffect(() => {
    if (isScrolling) return;

    const interval = setInterval(() => {
      try {
        if (activeImageIndex < user.images.length - 1) {
          scrollViewRef.current?.scrollTo({
            x: width * (activeImageIndex + 1),
            animated: true
          });
          setActiveImageIndex(prev => prev + 1);
        } else {
          scrollViewRef.current?.scrollTo({
            x: 0,
            animated: true
          });
          setActiveImageIndex(0);
        }
      } catch (error) {
        console.error('Error in image auto-scroll:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeImageIndex, isScrolling]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handleImageError = (imageUrl: string) => {
    setImageLoadError(prev => [...prev, imageUrl]);
  };

  const renderVerifiedBadge = () => (
    <BlurView intensity={80} className="absolute top-4 right-4 flex-row items-center px-3 py-1.5 rounded-full">
      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
      <Text className="text-white text-sm ml-1 font-medium">Verified</Text>
    </BlurView>
  );

  return (
    <Animated.View style={animatedStyle} className="flex-1">
      <ScrollView 
        className="flex-1 bg-white"
        bounces={false}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={() => setIsScrolling(true)}
        onScrollEndDrag={() => setIsScrolling(false)}
      >
        {/* Images Section */}
        <View className="relative">
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const offset = e.nativeEvent.contentOffset.x;
              const newIndex = Math.round(offset / width);
              setActiveImageIndex(newIndex);
            }}
            scrollEventThrottle={16}
          >
            {user.images.map((image, index) => (
              <View key={index} className="relative">
                <Image
                  source={{ 
                    uri: imageLoadError.includes(image) 
                      ? 'https://placeholder.com/user' 
                      : image 
                  }}
                  style={{ width, height: height * 0.7 }}
                  className="bg-gray-100"
                  resizeMode="cover"
                  onError={() => handleImageError(image)}
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.6)']}
                  style={{ position: 'absolute', width: '100%', height: '100%' }}
                />
              </View>
            ))}
          </ScrollView>

          {/* Image Indicators */}
          <View className="absolute top-4 w-full flex-row justify-center gap-1.5">
            {user.images.map((_, index) => (
              <View 
                key={index}
                className={`h-1 rounded-full ${index === activeImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
              />
            ))}
          </View>

          {renderVerifiedBadge()}

          {/* Image Navigation Controls */}
          <View className="absolute top-1/2 left-4 transform -translate-y-1/2">
            <TouchableOpacity onPress={() => setActiveImageIndex((prev) => prev - 1 < 0 ? user.images.length - 1 : prev - 1)}>
              <Ionicons name="chevron-back-circle" size={40} color="#fff" />
            </TouchableOpacity>
          </View>

          <View className="absolute top-1/2 right-4 transform -translate-y-1/2">
            <TouchableOpacity onPress={() => setActiveImageIndex((prev) => (prev + 1) % user.images.length)}>
              <Ionicons name="chevron-forward-circle" size={40} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* User Info */}
        <View className="px-5 py-6">
          <Text className="text-3xl font-bold">{user.name}, {user.age}</Text>
          <Text className="text-lg text-gray-600">{user.location}</Text>
          <Text className="text-lg text-gray-600">{user.occupation}</Text>
          
          {/* Floating Edit Button */}
          <TouchableOpacity 
            onPress={() => alert('Editing profile...')}
            className="absolute bottom-5 right-5 p-4 rounded-full bg-indigo-600"
          >
            <Ionicons name="pencil" size={24} color="#fff" />
          </TouchableOpacity>
          
          {/* Lifestyle Section */}
          <View className="mb-8 bg-gray-50 rounded-2xl p-5">
            <Text className="text-xl font-semibold mb-4 text-gray-800">Lifestyle</Text>
            <View className="flex-row justify-around">
              <View className="items-center">
                <Ionicons name="wallet-outline" size={24} color="#4B5563" />
                <Text className="text-gray-600 mt-2">{user.budget}</Text>
              </View>
              <View className="items-center">
                <Ionicons name="home-outline" size={24} color="#4B5563" />
                <Text className="text-gray-600 mt-2">{user.lifestyle}</Text>
              </View>
              <View className="items-center">
                <Ionicons name="heart-outline" size={24} color="#4B5563" />
                <Text className="text-gray-600 mt-2">{user.gender}</Text>
              </View>
            </View>
          </View>

          {/* About Section */}
          <Text className="text-xl font-semibold text-gray-800 mb-4">About</Text>
          <Text className="text-gray-600">{user.bio}</Text>

          {/* Interests Section */}
          <View className="mb-8">
            <Text className="text-xl font-semibold mb-4 text-gray-800">Interests</Text>
            <View className="flex-row flex-wrap gap-2">
              {user.interests.map((interest, index) => (
                <View key={index} className="bg-gray-100 rounded-full px-4 py-2">
                  <Text className="text-gray-700">{interest}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Prompt Section */}
          <View className="mb-8 bg-gray-50 rounded-2xl p-5">
            <Text className="text-xl font-semibold mb-3 text-gray-800">Prompt</Text>
            <Text className="text-gray-600">{user.prompt}</Text>
          </View>

          {/* Additional Details (Drinking, Smoking, etc.) */}
          <View className="mb-8">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-semibold text-gray-800">Drinking</Text>
              <Text className="text-gray-600">{user.drinking}</Text>
            </View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-semibold text-gray-800">Smoking</Text>
              <Text className="text-gray-600">{user.smoking}</Text>
            </View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-semibold text-gray-800">Religion</Text>
              <Text className="text-gray-600">{user.religion}</Text>
            </View>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-semibold text-gray-800">Height</Text>
              <Text className="text-gray-600">{user.height}</Text>
            </View>
          </View>

          <View className="h-40" />
        </View>
      </ScrollView>
    </Animated.View>
  );
}
