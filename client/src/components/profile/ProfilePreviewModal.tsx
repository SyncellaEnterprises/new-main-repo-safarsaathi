import { View, Text, Modal, ScrollView, TouchableOpacity, Image } from "react-native";
import Animated, { FadeIn, SlideInUp } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import React from "react";

interface ProfilePreviewModalProps {
  visible: boolean;
  onClose: () => void;
  userData: any;
  onEditSection: (section: string) => void;
}

export default function ProfilePreviewModal({ 
  visible, 
  onClose, 
  userData,
  onEditSection 
}: ProfilePreviewModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View className="flex-1 bg-black/50">
        <Animated.View 
          entering={SlideInUp}
          className="flex-1 bg-white mt-20 rounded-t-3xl overflow-hidden"
        >
          {/* Header */}
          <View className="flex-row justify-between items-center p-4 border-b border-slate-100">
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
            <Text className="text-lg font-semibold">Profile Preview</Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView className="flex-1">
            {/* Photos Section */}
            <TouchableOpacity 
              onPress={() => onEditSection('photos')}
              className="p-4 border-b border-slate-100"
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-semibold">Photos</Text>
                <Ionicons name="pencil" size={20} color="#6366f1" />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {userData.photos.map((photo: string, index: number) => (
                  <Image
                    key={index}
                    source={{ uri: photo }}
                    className="w-24 h-24 rounded-xl mr-2"
                  />
                ))}
              </ScrollView>
            </TouchableOpacity>

            {/* Basic Info Section */}
            <TouchableOpacity 
              onPress={() => onEditSection('basic-info')}
              className="p-4 border-b border-slate-100"
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-semibold">Basic Info</Text>
                <Ionicons name="pencil" size={20} color="#6366f1" />
              </View>
              <View className="space-y-2">
                <InfoItem label="Name" value={userData.name} />
                <InfoItem label="Age" value={userData.age.toString()} editable={false} />
                <InfoItem label="Gender" value={userData.gender} editable={false} />
                <InfoItem label="Occupation" value={userData.occupation} />
              </View>
            </TouchableOpacity>

            {/* Location Section */}
            <TouchableOpacity 
              onPress={() => onEditSection('location')}
              className="p-4 border-b border-slate-100"
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-semibold">Location</Text>
                <Ionicons name="pencil" size={20} color="#6366f1" />
              </View>
              <Text className="text-slate-600">
                {userData.location.district}, {userData.location.state}
              </Text>
            </TouchableOpacity>

            {/* About Section */}
            <TouchableOpacity 
              onPress={() => onEditSection('about')}
              className="p-4 border-b border-slate-100"
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-semibold">About</Text>
                <Ionicons name="pencil" size={20} color="#6366f1" />
              </View>
              <Text className="text-slate-600">{userData.about}</Text>
            </TouchableOpacity>

            {/* Interests Section */}
            <TouchableOpacity 
              onPress={() => onEditSection('interests')}
              className="p-4 border-b border-slate-100"
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-semibold">Interests</Text>
                <Ionicons name="pencil" size={20} color="#6366f1" />
              </View>
              <View className="flex-row flex-wrap">
                {userData.interests.map((interest: string, index: number) => (
                  <View 
                    key={index}
                    className="bg-primary-50 rounded-full px-4 py-2 mr-2 mb-2"
                  >
                    <Text className="text-primary-600">{interest}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>

            {/* Verification Status */}
            {!userData.isVerified && (
              <TouchableOpacity 
                onPress={() => onEditSection('verification')}
                className="m-4 bg-primary-50 p-4 rounded-xl"
              >
                <View className="flex-row items-center">
                  <Ionicons name="shield-outline" size={24} color="#6366f1" />
                  <View className="ml-3 flex-1">
                    <Text className="text-lg font-semibold text-primary-600">
                      Get Verified
                    </Text>
                    <Text className="text-slate-600">
                      Verify your profile to unlock all features
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={24} color="#6366f1" />
                </View>
              </TouchableOpacity>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
function InfoItem({ label, value, editable = true }: { 
  label: string; 
  value: string; 
  editable?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-slate-500">{label}</Text>
      <View className="flex-row items-center">
        <Text className="text-slate-700">{value}</Text>
        {!editable && (
          <Ionicons name="lock-closed" size={12} color="#94a3b8" className="ml-1" />
        )}
      </View>
    </View>
  );
} 
