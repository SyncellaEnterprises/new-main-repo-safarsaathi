import React from "react";
import { View, Text, ScrollView, TouchableOpacity, Modal, Image, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { UserProfile } from "@/src/hooks/useProfile";
import { BlurView } from "expo-blur";
import Animated, { FadeInDown } from "react-native-reanimated";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  userData: UserProfile | null;
}

export default function EditProfileModal({ 
  visible, 
  onClose, 
  onSave, 
  userData
}: EditProfileModalProps) {
  const router = useRouter();

  const handleEditSection = (section: string) => {
    onClose(); // Close modal before navigation
    switch (section) {
      case 'photos':
        router.push("/(settings)/edit-photos");
        break;
      case 'about':
        router.push("/(settings)/edit-about");
        break;
      case 'info':
        router.push("/(settings)/edit-info");
        break;
      case 'location':
        router.push("/(settings)/edit-location");
        break;
      case 'interests':
        router.push("/(settings)/edit-interests");
        break;
      case 'prompts':
        router.push("/(settings)/edit-prompts");
        break;
      case 'verification':
        router.push("/(settings)/verify");
        break;
    }
  };

  if (!userData) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
    >
      <BlurView intensity={20} tint="dark" className="flex-1">
        <Animated.View
          entering={FadeInDown}
          className="flex-1 mt-20 bg-white rounded-t-3xl"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-slate-100">
            <TouchableOpacity onPress={onClose}>
              <Text className="text-indigo-600">Cancel</Text>
            </TouchableOpacity>
            <Text className="text-lg font-semibold text-slate-800">Edit Profile</Text>
            <TouchableOpacity onPress={onSave}>
              <Text className="text-indigo-600">Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1">
            {/* Profile Preview */}
            <View className="p-6 border-b border-slate-100">
              <View className="items-center">
                <View className="w-24 h-24 bg-slate-100 rounded-full items-center justify-center mb-4">
                  {userData.profile_photo ? (
                    <Image
                      source={{ uri: userData.profile_photo }}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <Ionicons name="person" size={40} color="#94a3b8" />
                  )}
                </View>
                <Text className="text-xl font-semibold text-slate-800 mb-1">
                  {userData.username}
                </Text>
                <Text className="text-slate-500">
                  {userData.occupation || 'Add occupation'}
                </Text>
              </View>
            </View>

            {/* Edit Sections */}
            <View className="p-4 space-y-4">
              <EditSection
                title="Profile Photo"
                subtitle="Add or change your profile photo"
                icon="image-outline"
                onPress={() => handleEditSection('photos')}
              />
              
              <EditSection
                title="Basic Info"
                subtitle="Name, age, gender, occupation"
                icon="person-outline"
                onPress={() => handleEditSection('info')}
                info={`${userData.age || '-'} • ${userData.gender || '-'}`}
              />
              
              <EditSection
                title="Bio"
                subtitle="Tell others about yourself"
                icon="book-outline"
                onPress={() => handleEditSection('about')}
                info={userData.bio ? `${userData.bio.substring(0, 30)}...` : 'Add bio'}
              />
              
              <EditSection
                title="Location"
                subtitle="Where are you based?"
                icon="location-outline"
                onPress={() => handleEditSection('location')}
                info={userData.location || 'Add location'}
              />
              
              <EditSection
                title="Interests"
                subtitle="What do you like?"
                icon="heart-outline"
                onPress={() => handleEditSection('interests')}
                info={`${userData.interest?.length || 0} interests`}
              />
              
              <EditSection
                title="Prompts"
                subtitle="Add personality to your profile"
                icon="chatbubble-outline"
                onPress={() => handleEditSection('prompts')}
                info={`${userData.prompts?.prompts?.length || 0} prompts`}
              />
              
              {/* Verification Section */}
              <TouchableOpacity
                onPress={() => handleEditSection('verification')}
                className="bg-indigo-50 p-4 rounded-xl"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center">
                      <Ionicons name="shield-checkmark" size={20} color="#6366f1" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-lg font-semibold text-indigo-600">
                        Get Verified
                      </Text>
                      <Text className="text-slate-600 text-sm">
                        Verify your profile for more visibility
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#6366f1" />
                </View>
              </TouchableOpacity>
            </View>

            {/* Account Info */}
            <View className="p-6 bg-slate-50 mt-4">
              <Text className="text-sm font-medium text-slate-400 uppercase mb-4">
                Account Information
              </Text>
              <View className="space-y-4">
                <View>
                  <Text className="text-slate-400 text-sm">Email</Text>
                  <Text className="text-slate-600">{userData.email}</Text>
                </View>
                <View>
                  <Text className="text-slate-400 text-sm">Member Since</Text>
                  <Text className="text-slate-600">
                    {new Date(userData.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

function EditSection({ 
  title, 
  subtitle, 
  icon, 
  onPress,
  info
}: { 
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
  info?: string;
}) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="flex-row items-center justify-between p-4 bg-white rounded-xl border border-slate-100"
    >
      <View className="flex-row items-center flex-1">
        <View className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center">
          <Ionicons name={icon as any} size={20} color="#64748b" />
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-lg font-semibold text-slate-800">{title}</Text>
          <Text className="text-slate-500 text-sm">{subtitle}</Text>
        </View>
      </View>
      <View className="flex-row items-center">
        {info && (
          <Text className="text-slate-400 mr-2" numberOfLines={1}>
            {info}
          </Text>
        )}
        <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );
} 