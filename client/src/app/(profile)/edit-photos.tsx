import { View, Text, TouchableOpacity, Image, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState, useEffect } from "react";
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
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === "success" && data.user) {
          // Assuming photos come in a format like ["url1", "url2", ...]
          // First photo is profile photo
          if (data.user.photos && Array.isArray(data.user.photos)) {
            const userPhotos = data.user.photos.map((photoUrl, index) => ({
              id: String(index + 1),
              uri: photoUrl,
              isProfile: index === 0
            }));
            setPhotos(userPhotos);
          } else if (data.user.profile_photo) {
            // Fallback to profile_photo if no photos array
            setPhotos([{
              id: '1',
              uri: data.user.profile_photo,
              isProfile: true
            }]);
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
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert('Limit Reached', `You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0].uri) {
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri);
        if (!fileInfo.exists) {
          Alert.alert('Error', 'Could not access the selected photo');
          return;
        }

        const newPhoto = {
          id: Date.now().toString(),
          uri: result.assets[0].uri,
          isProfile: photos.length === 0 // First photo is profile photo
        };
        
        setPhotos(prev => [...prev, newPhoto]);
        setHasChanges(true);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const handleSetProfilePhoto = (id: string) => {
    setPhotos(prev => prev.map(photo => ({
      ...photo,
      isProfile: photo.id === id
    })));
    setHasChanges(true);
  };

  const handleDeletePhoto = (id: string) => {
    const photoToDelete = photos.find(p => p.id === id);
    
    // If deleting the profile photo, make the first remaining photo the profile photo
    if (photoToDelete?.isProfile && photos.length > 1) {
      const remainingPhotos = photos.filter(p => p.id !== id);
      const newProfileId = remainingPhotos[0].id;
      
      setPhotos(remainingPhotos.map(photo => ({
        ...photo,
        isProfile: photo.id === newProfileId
      })));
    } else {
      setPhotos(prev => prev.filter(photo => photo.id !== id));
    }
    
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      Alert.alert('No Changes', 'No changes were made to your photos');
      return;
    }

    if (photos.length === 0) {
      Alert.alert('No Photos', 'Please add at least one photo');
      return;
    }
    
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      // Find profile photo
      const profilePhoto = photos.find(p => p.isProfile)?.uri || photos[0]?.uri;
      
      // First, update profile photo
      if (profilePhoto) {
        const profileResponse = await fetch('http://10.0.2.2:5000/api/update/profile_photo', {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ profile_photo: profilePhoto })
        });
        
        if (!profileResponse.ok) {
          const profileResult = await profileResponse.json();
          throw new Error(profileResult.message || 'Failed to update profile photo');
        }
      }
      
      // Then update all photos
      const allPhotosResponse = await fetch('http://10.0.2.2:5000/api/update/photos', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ photos: photos.map(p => p.uri) })
      });
      
      const result = await allPhotosResponse.json();
      if (allPhotosResponse.ok && result.status === 'success') {
        Alert.alert('Success', 'Photos updated successfully');
        setHasChanges(false);
        router.back();
      } else {
        Alert.alert('Error', result.message || 'Failed to update photos');
      }
    } catch (error) {
      console.error('Error saving photos:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F8FAFF] justify-center items-center">
        <ActivityIndicator size="large" color="#1a237e" />
        <Text className="mt-4 text-[#1a237e]">Loading photos...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F8FAFF]">
      <Animated.View 
        entering={FadeInDown.duration(500)}
        className="bg-white px-6 pt-6 pb-4 border-b border-slate-100"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#1a237e" />
            <Text className="ml-2 text-[#1a237e]">Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-[#1a237e]">Edit Photos</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#1a237e" />
            ) : (
              <Text className={`font-semibold ${hasChanges ? 'text-[#1a237e]' : 'text-gray-400'}`}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-2xl font-bold text-[#1a237e] mb-2">
          Profile Photos
        </Text>
        <Text className="text-slate-500 mb-6 text-base">
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
                <View className="absolute bottom-2 left-2 bg-[#1a237e] rounded-full px-3 py-1">
                  <Text className="text-white text-xs font-medium">Profile</Text>
                </View>
              )}
            </Animated.View>
          ))}

          {photos.length < MAX_PHOTOS && (
            <TouchableOpacity
              onPress={pickImage}
              className="w-40 h-40 rounded-2xl border-2 border-dashed border-[#1a237e] items-center justify-center bg-indigo-50"
            >
              <Ionicons name="add-circle-outline" size={30} color="#1a237e" />
              <Text className="text-[#1a237e] mt-2 font-medium">Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        <View className="mt-6 bg-indigo-50 p-5 rounded-xl">
          <View className="flex-row items-center">
            <Ionicons name="information-circle" size={24} color="#1a237e" />
            <Text className="text-[#1a237e] font-semibold ml-2">Photo Tips</Text>
          </View>
          <View className="mt-2 space-y-2">
            <Text className="text-slate-600">• Clear, recent photos of yourself</Text>
            <Text className="text-slate-600">• Mix of close-up and full-body shots</Text>
            <Text className="text-slate-600">• Show your interests and personality</Text>
            <Text className="text-slate-600">• Avoid group photos in first 3 photos</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
} 