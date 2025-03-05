import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/400x600?text=No+Image';

interface UserCardProps {
  user: {
    username: string;
    city?: string;
    interests?: string | string[];
    similarity_score?: number;
    age?: number;
    bio?: string;
    gender?: string;
    occupation?: string;
    profile_photo?: string | null;
    prompts?: {
      prompts: Array<{
        question: string;
        answer: string;
      }>;
    };
    location?: string;
    lifestyle?: string;
    budget?: string;
    drinking?: string;
    smoking?: string;
    religion?: string;
    height?: string;
  };
}

export function UserCard({ user }: UserCardProps) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState<string[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const scale = useSharedValue(1);

  // Convert string interests to array if needed
  const interests = typeof user.interests === 'string' 
    ? user.interests.split(',').map(i => i.trim())
    : Array.isArray(user.interests) 
      ? user.interests 
      : [];

  // Create an array of images (in this case just one from profile_photo)
  const images = user.profile_photo ? [user.profile_photo] : [DEFAULT_PROFILE_IMAGE];

  // Auto-slide images with error handling
  useEffect(() => {
    if (isScrolling || images.length <= 1) return;

    const interval = setInterval(() => {
      try {
        if (activeImageIndex < images.length - 1) {
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
  }, [activeImageIndex, isScrolling, images.length]);

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
        className="flex-1 bg-white rounded-3xl overflow-hidden"
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
            {images.map((image, index) => (
              <View key={index} className="relative">
                <Image
                  source={{ 
                    uri: imageLoadError.includes(image) 
                      ? DEFAULT_PROFILE_IMAGE 
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
          {images.length > 1 && (
            <View className="absolute top-4 w-full flex-row justify-center gap-1.5">
              {images.map((_, index) => (
                <View 
                  key={index}
                  className={`h-1 rounded-full ${index === activeImageIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
                />
              ))}
            </View>
          )}

          {renderVerifiedBadge()}

          {/* Image Navigation Controls */}
          {images.length > 1 && (
            <>
              <View className="absolute top-1/2 left-4 transform -translate-y-1/2">
                <TouchableOpacity onPress={() => setActiveImageIndex((prev) => prev - 1 < 0 ? images.length - 1 : prev - 1)}>
                  <Ionicons name="chevron-back-circle" size={40} color="#fff" />
                </TouchableOpacity>
              </View>

              <View className="absolute top-1/2 right-4 transform -translate-y-1/2">
                <TouchableOpacity onPress={() => setActiveImageIndex((prev) => (prev + 1) % images.length)}>
                  <Ionicons name="chevron-forward-circle" size={40} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* User Info */}
        <View className="px-5 py-6">
          <Text className="text-3xl font-bold">
            {user.username}{user.age ? `, ${user.age}` : ''}
          </Text>
          <Text className="text-lg text-gray-600">
            {user.location || user.city || 'Location not specified'}
          </Text>
          {user.occupation && (
            <Text className="text-lg text-gray-600">{user.occupation}</Text>
          )}
          
          {/* Lifestyle Section */}
          {(user.lifestyle || user.budget || user.gender) && (
            <View className="mb-8 bg-gray-50 rounded-2xl p-5 mt-4">
              <Text className="text-xl font-semibold mb-4 text-gray-800">Lifestyle</Text>
              <View className="flex-row justify-around">
                {user.budget && (
                  <View className="items-center">
                    <Ionicons name="wallet-outline" size={24} color="#4B5563" />
                    <Text className="text-gray-600 mt-2">{user.budget}</Text>
                  </View>
                )}
                {user.lifestyle && (
                  <View className="items-center">
                    <Ionicons name="home-outline" size={24} color="#4B5563" />
                    <Text className="text-gray-600 mt-2">{user.lifestyle}</Text>
                  </View>
                )}
                {user.gender && (
                  <View className="items-center">
                    <Ionicons name="heart-outline" size={24} color="#4B5563" />
                    <Text className="text-gray-600 mt-2">{user.gender}</Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* About Section */}
          {user.bio && (
            <>
              <Text className="text-xl font-semibold text-gray-800 mb-4">About</Text>
              <Text className="text-gray-600">{user.bio}</Text>
            </>
          )}

          {/* Interests Section */}
          {interests.length > 0 && (
            <View className="mb-8 mt-6">
              <Text className="text-xl font-semibold mb-4 text-gray-800">Interests</Text>
              <View className="flex-row flex-wrap gap-2">
                {interests.map((interest, index) => (
                  <View key={index} className="bg-gray-100 rounded-full px-4 py-2">
                    <Text className="text-gray-700">{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Prompts Section */}
          {user.prompts && user.prompts.prompts && user.prompts.prompts.length > 0 && (
            <View className="mb-8 bg-gray-50 rounded-2xl p-5">
              <Text className="text-xl font-semibold mb-3 text-gray-800">Prompts</Text>
              {user.prompts.prompts.map((prompt, index) => (
                <View key={index} className="mb-4 last:mb-0">
                  <Text className="text-indigo-600 font-medium mb-2">{prompt.question}</Text>
                  <Text className="text-gray-600">{prompt.answer}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Additional Details */}
          {(user.drinking || user.smoking || user.religion || user.height) && (
            <View className="mb-8">
              {user.drinking && (
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-semibold text-gray-800">Drinking</Text>
                  <Text className="text-gray-600">{user.drinking}</Text>
                </View>
              )}
              {user.smoking && (
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-semibold text-gray-800">Smoking</Text>
                  <Text className="text-gray-600">{user.smoking}</Text>
                </View>
              )}
              {user.religion && (
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-semibold text-gray-800">Religion</Text>
                  <Text className="text-gray-600">{user.religion}</Text>
                </View>
              )}
              {user.height && (
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-semibold text-gray-800">Height</Text>
                  <Text className="text-gray-600">{user.height}</Text>
                </View>
              )}
            </View>
          )}

          {user.similarity_score !== undefined && (
            <View className="mb-8 bg-indigo-50 rounded-2xl p-5">
              <Text className="text-xl font-semibold mb-2 text-indigo-800">Match Score</Text>
              <Text className="text-indigo-600">
                {Math.round(user.similarity_score * 100)}% Compatible
              </Text>
            </View>
          )}

          <View className="h-20" />
        </View>
      </ScrollView>
    </Animated.View>
  );
}
