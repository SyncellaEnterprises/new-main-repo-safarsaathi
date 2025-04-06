import { View, Text, TouchableOpacity, Image, ActivityIndicator, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Animated, { 
  FadeInDown, 
  Layout, 
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  FadeIn,
  SlideInRight,
  ZoomIn
} from "react-native-reanimated";
import { useState, useEffect } from "react";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import * as FileSystem from "expo-file-system";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from "expo-blur";

const { width } = Dimensions.get('window');
const GRID_GAP = 12;
const PHOTOS_PER_ROW = 2;
const PHOTO_SIZE = (width - 48 - (PHOTOS_PER_ROW - 1) * GRID_GAP) / PHOTOS_PER_ROW;

export default function PhotosScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updatePhotos, isLoading } = useOnboarding();
  const [photos, setPhotos] = useState<{ id: string; uri: string }[]>([]);
  const [isPickerLoading, setIsPickerLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isSkeletonVisible, setIsSkeletonVisible] = useState(true);
  
  const scale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSkeletonVisible(false);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${withSpring((100 * photos.length) / 6)}%`,
    height: 4,
    backgroundColor: photos.length >= 2 ? '#50A6A7' : '#7D5BA6',
    borderRadius: 4,
  }));

  const pickImage = async () => {
    try {
      setIsPickerLoading(true);
      setUploadError(null);
      
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        setUploadError("Camera roll permission denied");
        toast.show("Please allow access to your photos", "error");
        setIsPickerLoading(false);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 0.8,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0].uri) {
        if (photos.length >= 6) {
          toast.show("Maximum 6 photos allowed", "error");
          setIsPickerLoading(false);
          return;
        }

        // Check file size
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        if (!fileInfo.exists) {
          setUploadError("Could not access the selected photo");
          toast.show("Could not access the selected photo", "error");
          setIsPickerLoading(false);
          return;
        }

        // Check if file size is too large (>5MB)
        if (fileInfo.size > 5 * 1024 * 1024) {
          setUploadError("Photo size is too large (max 5MB)");
          toast.show("Photo size is too large (max 5MB)", "error");
          setIsPickerLoading(false);
          return;
        }

        scale.value = withSpring(1.05, {}, () => {
          scale.value = withSpring(1);
        });

        setPhotos(prev => [...prev, {
          id: Date.now().toString(),
          uri: result.assets[0].uri
        }]);
      }
    } catch (error) {
      console.error('Photo selection error:', error);
      setUploadError("Error selecting photo");
      toast.show("Error selecting photo", "error");
    } finally {
      setIsPickerLoading(false);
    }
  };

  const removePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const handleNext = async () => {
    if (photos.length < 2) {
      toast.show("Please add at least 2 photos", "error");
      return;
    }

    try {
      setUploadError(null);
      const success = await updatePhotos(photos.map(p => p.uri));
      if (success) {
        router.push('/onboarding/gender');
      } else {
        setUploadError("Failed to save photos");
        toast.show("Failed to save photos. Please try again.", "error");
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      setUploadError("Error uploading photos");
      toast.show("Error uploading photos. Please try again.", "error");
    }
  };

  // Render skeleton loaders
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <Animated.View
        key={`skeleton-${index}`}
        entering={FadeIn.delay(index * 200)}
        className="bg-neutral-dark/50 rounded-2xl overflow-hidden"
        style={{ width: PHOTO_SIZE, height: PHOTO_SIZE, marginBottom: GRID_GAP }}
      >
        <LinearGradient
          colors={['rgba(125, 91, 166, 0.1)', 'rgba(125, 91, 166, 0.2)', 'rgba(125, 91, 166, 0.1)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="w-full h-full"
          style={{
            opacity: isSkeletonVisible ? 1 : 0,
          }}
        />
      </Animated.View>
    ));
  };

  return (
    <View className="flex-1 bg-neutral-darkest">
      <Animated.View 
        entering={FadeInDown.duration(800).springify()}
        className="flex-1 p-6"
      >
        {/* Header */}
        <View className="mb-6">
          <Text className="text-3xl font-bold mb-3 text-primary font-youngSerif">
            Your Best Shots
          </Text>
          <Text className="text-neutral-medium font-montserrat">
            Add photos that show your personality and lifestyle
          </Text>
          {uploadError && (
            <Animated.View 
              entering={SlideInRight}
              className="mt-3 bg-red-900/30 border border-red-500/30 rounded-lg p-3 flex-row items-center"
            >
              <Ionicons name="alert-circle" size={20} color="#f87171" />
              <Text className="text-red-400 ml-2 font-montserrat">{uploadError}</Text>
            </Animated.View>
          )}
        </View>

        {/* Progress Indicator */}
        <View className="mb-8">
          <View className="bg-neutral-dark/50 h-4 rounded-full overflow-hidden">
            <Animated.View style={progressStyle} />
          </View>
          <View className="flex-row items-center justify-between mt-3">
            <View className="flex-row items-center">
              <Ionicons name="images-outline" size={18} color="#9D7EBD" />
              <Text className="text-primary-light font-montserratMedium ml-2">
                {photos.length}/6 photos
              </Text>
            </View>
            <Text className={`text-sm font-montserrat ${photos.length >= 2 ? 'text-secondary' : 'text-neutral-medium'}`}>
              {photos.length >= 2 ? '✓ Minimum reached' : 'Add at least 2 photos'}
            </Text>
          </View>
        </View>

        {/* Main Content */}
        <View className="flex-1">
          {/* Photo Tips Card */}
          <BlurView intensity={20} tint="dark" className="rounded-2xl mb-6 overflow-hidden">
            <LinearGradient
              colors={['rgba(125, 91, 166, 0.1)', 'rgba(157, 126, 189, 0.05)']}
              className="p-4 border border-primary-light/20"
              style={{ borderRadius: 16 }}
            >
              <View className="flex-row items-start">
                <View className="w-10 h-10 rounded-full bg-primary/20 items-center justify-center mr-3">
                  <Ionicons name="bulb-outline" size={20} color="#9D7EBD" />
                </View>
                <View className="flex-1">
                  <Text className="text-neutral-light font-montserratMedium mb-1">Photo Tips</Text>
                  <Text className="text-neutral-medium text-sm font-montserrat">
                    Clear face photos work best. Variety in your photos (activities, travel, etc.) helps show your personality.
                  </Text>
                </View>
              </View>
            </LinearGradient>
          </BlurView>

          {/* Photos Grid */}
          <View className="flex-row flex-wrap justify-between">
            {isSkeletonVisible ? (
              renderSkeletons()
            ) : (
              <>
                {photos.map((photo, index) => (
                  <Animated.View
                    key={photo.id}
                    entering={ZoomIn.delay(index * 100)}
                    layout={Layout.springify()}
                    className="mb-3"
                    style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
                  >
                    <LinearGradient
                      colors={['#7D5BA6', '#9D7EBD']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      className="rounded-2xl p-1 w-full h-full"
                    >
                      <Image
                        source={{ uri: photo.uri }}
                        style={{ width: '100%', height: '100%' }}
                        className="rounded-xl"
                      />
                    </LinearGradient>
                    
                    <TouchableOpacity
                      onPress={() => removePhoto(photo.id)}
                      className="absolute -top-2 -right-2 bg-neutral-dark border border-red-500 rounded-full p-1.5"
                    >
                      <Ionicons name="close" size={16} color="#f87171" />
                    </TouchableOpacity>
                    
                    {index === 0 && (
                      <View className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-primary/90 border border-primary rounded-full px-3 py-1 shadow-lg">
                        <Text className="text-white text-xs font-montserratBold">Profile</Text>
                      </View>
                    )}
                  </Animated.View>
                ))}

                {photos.length < 6 && Array(6 - photos.length).fill(0).map((_, i) => (
                  <Animated.View
                    key={`empty-${i}`}
                    entering={FadeIn.delay(photos.length * 100 + i * 100)}
                    layout={Layout.springify()}
                    className="mb-3"
                    style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
                  >
                    <TouchableOpacity
                      onPress={pickImage}
                      className="bg-neutral-dark/60 rounded-2xl items-center justify-center border border-primary-light/20 w-full h-full"
                      disabled={isPickerLoading || isLoading}
                    >
                      {isPickerLoading && i === 0 ? (
                        <ActivityIndicator color="#9D7EBD" size="small" />
                      ) : (
                        <>
                          <View className="w-12 h-12 rounded-full bg-primary/10 items-center justify-center mb-2">
                            <Ionicons name="add" size={24} color="#9D7EBD" />
                          </View>
                          <Text className="text-neutral-medium text-xs font-montserrat">
                            {i === 0 ? 'Add Photo' : ''}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                ))}
              </>
            )}
          </View>
        </View>

        {/* Continue Button */}
        <View className="mt-auto pt-6">
          <LinearGradient
            colors={photos.length >= 2 ? ['#7D5BA6', '#9D7EBD'] : ['#3E3C47', '#3E3C47']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            className="rounded-xl overflow-hidden"
          >
            <TouchableOpacity
              onPress={handleNext}
              disabled={photos.length < 2 || isLoading}
              className="py-4 px-6"
            >
              {isLoading ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white ml-2 font-montserratBold">Uploading...</Text>
                </View>
              ) : (
                <View className="flex-row items-center justify-center">
                  <Text className={`text-center text-lg font-montserratBold ${
                    photos.length >= 2 ? 'text-white' : 'text-neutral-medium'
                  }`}>
                    {photos.length < 2 ? 'Add more photos' : 'Continue'}
                  </Text>
                  {photos.length >= 2 && (
                    <Ionicons name="arrow-forward" size={20} color="white" className="ml-2" />
                  )}
                </View>
              )}
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </Animated.View>
    </View>
  );
}
