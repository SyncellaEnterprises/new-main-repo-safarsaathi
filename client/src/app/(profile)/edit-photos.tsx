import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";

interface Photo {
  id: string;
  uri: string;
  isProfile?: boolean;
}

export default function EditPhotosScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState<Photo[]>([
    { id: '1', uri: 'https://placeholder.com/400', isProfile: true },
    { id: '2', uri: 'https://placeholder.com/400' },
    { id: '3', uri: 'https://placeholder.com/400' },
  ]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      const newPhoto = {
        id: Date.now().toString(),
        uri: result.assets[0].uri,
      };
      setPhotos(prev => [...prev, newPhoto]);
    }
  };

  const handleSetProfilePhoto = (id: string) => {
    setPhotos(prev => prev.map(photo => ({
      ...photo,
      isProfile: photo.id === id
    })));
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

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
          <TouchableOpacity>
            <Text className="text-primary-600 font-semibold">Save</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-2xl font-bold text-[#1a237e] mb-2">
          Profile Photos
        </Text>
        <Text className="text-slate-500 mb-6 text-base">
          Add up to 6 photos. First photo will be your profile picture.
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

          {photos.length < 6 && (
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