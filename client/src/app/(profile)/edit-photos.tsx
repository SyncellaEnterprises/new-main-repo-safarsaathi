import React, { useState, useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from "expo-file-system";

interface Photo {
  id: string;
  uri: string;
  isProfile?: boolean;
}

export default function EditPhotosScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const MAX_PHOTOS = 6;

  useEffect(() => {
    fetchUserPhotos();
  }, []);

  const fetchUserPhotos = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch('http://10.0.2.2:5000/api/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.status === "success" && data.user) {
          // First photo is profile photo
          if (data.user.photos && Array.isArray(data.user.photos)) {
            const userPhotos = data.user.photos.map((photoUrl: string, index: number) => ({
              id: String(index + 1),
              uri: photoUrl,
              isProfile: index === 0
            }));
            setPhotos(userPhotos);
          }
        }
      } else {
        Alert.alert('Error', 'Failed to load photos');
      }
    } catch (error) {
      console.error('Error fetching photos:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };
  
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        
        // Check file size (max 5MB)
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (fileInfo.exists && fileInfo.size && fileInfo.size > 5 * 1024 * 1024) {
          Alert.alert("File too large", "Please select an image under 5MB");
          return;
        }
        
        // Generate a unique ID for the new photo
        const newId = String(Date.now());
        
        const newPhoto: Photo = {
          id: newId,
          uri: uri,
          isProfile: photos.length === 0 // First photo is profile by default
        };
        
        setPhotos(prevPhotos => [...prevPhotos, newPhoto]);
        setHasChanges(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  const handleSetProfilePhoto = (id: string) => {
    setPhotos(prevPhotos => prevPhotos.map(photo => ({
      ...photo,
      isProfile: photo.id === id
    })));
    setHasChanges(true);
  };
  
  const handleDeletePhoto = (id: string) => {
    // Check if it's the profile photo
    const isProfilePhoto = photos.find(p => p.id === id)?.isProfile;
    
    // Remove the photo
    const updatedPhotos = photos.filter(photo => photo.id !== id);
    
    // If we deleted the profile photo, set the first remaining photo as profile
    if (isProfilePhoto && updatedPhotos.length > 0) {
      updatedPhotos[0].isProfile = true;
    }
    
    setPhotos(updatedPhotos);
    setHasChanges(true);
  };
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // Format photos array - sort so profile photo is first
      const formattedPhotos = [...photos].sort((a, b) => {
        if (a.isProfile) return -1;
        if (b.isProfile) return 1;
        return 0;
      });
      
      // Extract URIs in the sorted order
      const photoUris = formattedPhotos.map(photo => photo.uri);
      
      const response = await fetch('http://10.0.2.2:5000/api/update/photos', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ photos: photoUris })
      });
      
      if (response.ok) {
        Alert.alert('Success', 'Photos updated successfully');
        setHasChanges(false);
        router.back();
      } else {
        const errorData = await response.text();
        console.error('Error response:', errorData);
        Alert.alert('Error', 'Failed to update photos');
      }
    } catch (error) {
      console.error('Error saving photos:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <View className="flex-1 bg-neutral-light justify-center items-center">
        <ActivityIndicator size="large" color="#7D5BA6" />
        <Text className="mt-4 text-primary">Loading photos...</Text>
      </View>
    );
  }
  
  return (
    <View className="flex-1 bg-neutral-light">
      <Animated.View 
        entering={FadeInDown.duration(500)}
        className="bg-neutral-lightest px-6 pt-6 pb-4 border-b border-neutral-medium"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#7D5BA6" />
            <Text className="ml-2 text-primary font-montserratMedium">Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-youngSerif text-primary-dark">Edit Photos</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#7D5BA6" />
            ) : (
              <Text className={`font-montserratMedium ${hasChanges ? 'text-primary' : 'text-neutral-dark/40'}`}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-2xl font-youngSerif text-primary-dark mb-2">
          Profile Photos
        </Text>
        <Text className="text-neutral-dark mb-6 text-base font-montserrat">
          Add up to {MAX_PHOTOS} photos. First photo will be your profile picture.
        </Text>

        <View className="flex-row flex-wrap gap-4">
          {photos.map((photo, index) => (
            <Animated.View
              key={photo.id}
              entering={FadeIn.delay(index * 100)}
              className="relative"
            >
              <Image
                source={{ uri: photo.uri }}
                className="w-40 h-40 rounded-2xl"
              />
              <View className="absolute top-2 right-2 flex-row space-x-2">
                {!photo.isProfile && (
                  <TouchableOpacity
                    onPress={() => handleSetProfilePhoto(photo.id)}
                    className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-lg items-center justify-center"
                  >
                    <Ionicons name="star" size={16} color="white" />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => handleDeletePhoto(photo.id)}
                  className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-lg items-center justify-center"
                >
                  <Ionicons name="trash" size={16} color="white" />
                </TouchableOpacity>
              </View>
              {photo.isProfile && (
                <View className="absolute bottom-2 left-2 bg-primary rounded-full px-3 py-1">
                  <Text className="text-white text-xs font-montserratMedium">Profile</Text>
                </View>
              )}
            </Animated.View>
          ))}

          {photos.length < MAX_PHOTOS && (
            <TouchableOpacity
              onPress={pickImage}
              className="w-40 h-40 rounded-2xl border-2 border-dashed border-primary items-center justify-center bg-primary/10"
            >
              <Ionicons name="add-circle-outline" size={30} color="#7D5BA6" />
              <Text className="text-primary mt-2 font-montserratMedium">Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="mt-6 bg-primary/10 p-5 rounded-xl">
          <View className="flex-row items-center">
            <Ionicons name="information-circle" size={24} color="#7D5BA6" />
            <Text className="text-primary font-montserratMedium ml-2">Photo Tips</Text>
          </View>
          <View className="mt-2 space-y-2">
            <Text className="text-neutral-dark font-montserrat">• Clear, recent photos of yourself</Text>
            <Text className="text-neutral-dark font-montserrat">• Mix of close-up and full-body shots</Text>
            <Text className="text-neutral-dark font-montserrat">• Show your interests and personality</Text>
            <Text className="text-neutral-dark font-montserrat">• Avoid group photos in first 3 photos</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
} 