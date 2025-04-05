import React, { useState, useRef, useEffect } from 'react';
import { View, Text, Image, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

const DEFAULT_PROFILE_IMAGE = 'https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png';

interface UserCardProps {
  user: {
    username: string;
    location: string;
    interests: string[] | string;
    similarity_score: number;
    age: number;
    bio: string;
    gender: string;
    occupation: string;
    profile_photo: string | null;
    prompts: {
      prompts: Array<{
        question: string;
        answer: string;
      }>;
    };
    recommended_user_profile_id: number;
  };
}

export function UserCard({ user }: UserCardProps) {
  // If user is undefined, show a placeholder
  if (!user) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-lightest rounded-3xl p-8">
        <Text className="text-xl text-neutral-dark text-center font-montserrat">
          No more profiles available. Check back later!
        </Text>
      </View>
    );
  }

  console.log('Rendering user card:', user.username);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [imageLoadError, setImageLoadError] = useState<string[]>([]);
  const [isScrolling, setIsScrolling] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const scale = useSharedValue(1);

  // Process the profile photo - handles both string URLs and JSON strings
  const processProfilePhoto = () => {
    if (!user.profile_photo) return null;
    
    try {
      // Check if it's a JSON string
      if (typeof user.profile_photo === 'string' && 
          (user.profile_photo.startsWith('{') || user.profile_photo.startsWith('['))) {
        const parsed = JSON.parse(user.profile_photo);
        return parsed.url || parsed[0]?.url || parsed;
      }
      // Just return the string
      return user.profile_photo;
    } catch (e) {
      console.error('Error processing profile photo:', e);
      return user.profile_photo; // Return original on error
    }
  };

  const profilePhoto = processProfilePhoto();
  const images = profilePhoto ? [profilePhoto] : [DEFAULT_PROFILE_IMAGE];

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

  // Debug user data on load
  useEffect(() => {
    console.log('User data for card:', {
      username: user.username,
      interests: user.interests,
      similarity_score: user.similarity_score,
      profile_photo: user.profile_photo,
      id: user.recommended_user_profile_id
    });
  }, [user]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const handleImageError = (imageUrl: string) => {
    console.error('Image failed to load:', imageUrl);
    setImageLoadError(prev => [...prev, imageUrl]);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const renderVerifiedBadge = () => (
    <BlurView intensity={80} className="absolute top-4 right-4 flex-row items-center px-3 py-1.5 rounded-full">
      <Ionicons name="checkmark-circle" size={16} color="#50A6A7" />
      <Text className="text-white text-sm ml-1 font-montserratMedium">Verified</Text>
    </BlurView>
  );

  // Process interests to ensure it's always an array of strings
  const processInterests = () => {
    if (!user.interests) return [];
    
    if (Array.isArray(user.interests)) {
      return user.interests;
    }

    if (typeof user.interests === 'string') {
      // Handle potential JSON format with braces and quotes
      return user.interests
        .replace(/[{}"]/g, '') // Remove all braces and quotes
        .split(',')
        .map(i => i.trim())
        .filter(i => i);
    }
    
    return [];
  };

  const interestsArray = processInterests();

  return (
    <Animated.View style={animatedStyle} className="flex-1">
      <ScrollView 
        className="flex-1 bg-neutral-lightest rounded-3xl overflow-hidden shadow-md"
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
                {imageLoading && (
                  <View style={{ width, height: height * 0.7 }} className="absolute items-center justify-center bg-neutral-medium">
                    <ActivityIndicator size="large" color="#7D5BA6" />
                  </View>
                )}
                <Image
                  source={{ 
                    uri: imageLoadError.includes(image) 
                      ? DEFAULT_PROFILE_IMAGE 
                      : image 
                  }}
                  style={{ width, height: height * 0.7 }}
                  className="bg-neutral-medium"
                  resizeMode="cover"
                  onError={() => handleImageError(image)}
                  onLoad={handleImageLoad}
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
          <View className="flex-row justify-between items-center">
            <Text className="text-2xl font-youngSerif text-primary-dark">
              {user.username.replace('user_', '')}, {user.age || 'N/A'}
            </Text>
            <View className="bg-primary-light/20 px-3 py-1 rounded-full">
              <Text className="text-primary-dark font-montserratMedium">
                {Math.round((user.similarity_score || 0) * 100)}%
              </Text>
            </View>
          </View>
          
          <View className="flex-row items-center mt-2">
            <Ionicons name="location-outline" size={18} color="#7D5BA6" />
            <Text className="text-base text-neutral-dark ml-1.5 font-montserrat">
              {user.location || 'Location not specified'}
            </Text>
          </View>

          <View className="flex-row items-center mt-2">
            <Ionicons name="briefcase-outline" size={18} color="#7D5BA6" />
            <Text className="text-base text-neutral-dark ml-1.5 font-montserrat">
              {user.occupation || 'Occupation not specified'}
            </Text>
          </View>

          {/* Gender */}
          <View className="flex-row items-center mt-2">
            <Ionicons name="person-outline" size={18} color="#7D5BA6" />
            <Text className="text-base text-neutral-dark ml-1.5 font-montserrat capitalize">
              {user.gender || 'Not specified'}
            </Text>
          </View>

          {/* About Section */}
          {user.bio && (
            <View className="mt-6">
              <Text className="text-lg font-youngSerif text-primary-dark mb-2">About</Text>
              <Text className="text-neutral-dark font-montserrat">{user.bio}</Text>
            </View>
          )}

          {/* Interests Section */}
          {interestsArray.length > 0 && (
            <View className="mt-6">
              <Text className="text-lg font-youngSerif mb-3 text-primary-dark">Interests</Text>
              <View className="flex-row flex-wrap gap-2">
                {interestsArray.map((interest: string, index: number) => (
                  <View key={index} className="bg-secondary/10 rounded-full px-4 py-2">
                    <Text className="text-secondary-dark font-montserratMedium">{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Prompts Section */}
          {user.prompts?.prompts?.length > 0 && (
            <View className="mt-6 bg-neutral-light rounded-2xl p-5">
              <Text className="text-lg font-youngSerif mb-4 text-primary-dark">Prompts</Text>
              {user.prompts.prompts.map((prompt, index) => (
                <View key={index} className="mb-4 last:mb-0">
                  <Text className="text-primary font-montserratMedium mb-2">{prompt.question}</Text>
                  <Text className="text-neutral-dark font-montserrat">{prompt.answer}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Match Score */}
          <View className="mt-6 bg-accent/10 rounded-2xl p-5">
            <Text className="text-lg font-youngSerif mb-2 text-accent-dark">Match Score</Text>
            <Text className="text-accent-dark text-base font-montserratMedium">
              {Math.round((user.similarity_score || 0) * 100)}% Compatible
            </Text>
          </View>

          <View className="h-20" />
        </View>
      </ScrollView>
    </Animated.View>
  );
}
