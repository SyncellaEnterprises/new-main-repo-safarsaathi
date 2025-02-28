import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Animated, { 
  FadeInDown, 
  Layout, 
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  FadeIn
} from "react-native-reanimated";
import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useOnboarding } from "../../context/OnboardingContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import * as FileSystem from "expo-file-system";

const PHOTO_SIZE = 110; // Size of each photo box

export default function PhotosScreen() {
  const router = useRouter();
  const toast = useToast();
  const { updatePhotos, isLoading } = useOnboarding();
  const [photos, setPhotos] = useState<{ id: string; uri: string }[]>([]);
  const scale = useSharedValue(1);
  const progressWidth = useSharedValue(0);

  const progressStyle = useAnimatedStyle(() => ({
    width: withSpring((100 * photos.length) / 6 + '%'),
    height: 3,
    backgroundColor: photos.length >= 2 ? '#10b981' : '#6366f1',
    borderRadius: 2,
  }));

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8, // Reduced quality for faster upload
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets[0].uri) {
        if (photos.length >= 6) {
          toast.show("Maximum 6 photos allowed", "error");
          return;
        }

        // Verify the file exists and is accessible
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        if (!fileInfo.exists) {
          toast.show("Could not access the selected photo", "error");
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
      toast.show("Error selecting photo", "error");
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
      const success = await updatePhotos(photos.map(p => p.uri));
      if (success) {
        router.push('/onboarding/gender');
      } else {
        toast.show("Failed to save photos. Please try again.", "error");
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      toast.show("Error uploading photos. Please try again.", "error");
    }
  };

  return (
    <View className="flex-1 bg-primary-light">
      <Animated.View 
        entering={FadeInDown.duration(1000).springify()}
        className="flex-1 p-6"
      >
        <Text className="text-3xl font-bold mb-2 text-indigo-600">
          Add your photos
        </Text>
        <Text className="text-slate-500 mb-8">
          Add at least 2 photos to continue
        </Text>

        <View className="mt-2 mb-6">
          <Animated.View style={progressStyle} />
          <View className="flex-row items-center justify-between mt-2">
            <Text className="text-indigo-600 font-medium">
              {photos.length}/6 photos
            </Text>
            {photos.length < 2 && (
              <Text className="text-indigo-500 text-sm">
                Add at least 2 photos
              </Text>
            )}
          </View>
        </View>

        <View className="flex-row flex-wrap gap-3">
          {photos.map((photo, index) => (
            <Animated.View
              key={photo.id}
              entering={FadeIn.delay(index * 100)}
              layout={Layout.springify()}
              className="relative"
            >
              <Image
                source={{ uri: photo.uri }}
                style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
                className="rounded-2xl"
              />
              <TouchableOpacity
                onPress={() => removePhoto(photo.id)}
                className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1"
              >
                <Ionicons name="close" size={16} color="white" />
              </TouchableOpacity>
              {index === 0 && (
                <View className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-indigo-600 rounded-full px-3 py-1 shadow-sm">
                  <Text className="text-white text-xs font-medium">Profile</Text>
                </View>
              )}
            </Animated.View>
          ))}

          {photos.length < 6 && (
            <Animated.View
              entering={FadeIn}
              layout={Layout.springify()}
            >
              <TouchableOpacity
                onPress={pickImage}
                style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
                className="bg-white rounded-2xl items-center justify-center border border-indigo-100 shadow-sm"
                disabled={isLoading}
              >
                <View className="w-12 h-12 rounded-xl bg-indigo-50 items-center justify-center mb-2">
                  <Ionicons name="add" size={24} color="#6366f1" />
                </View>
                <Text className="text-slate-500 text-sm">Add Photo</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        <View className="mt-auto">
          <TouchableOpacity
            onPress={handleNext}
            disabled={photos.length < 2 || isLoading}
            className={`py-4 rounded-xl shadow-sm ${
              photos.length >= 2 ? 'bg-indigo-600' : 'bg-slate-300'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center text-lg font-semibold">
                {photos.length < 2 ? 'Add at least 2 photos' : 'Continue'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}
