import { View, Text, ScrollView, TouchableOpacity, Modal, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: () => void;
  userData: any;
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
        router.push('/(profile)/edit-photos');
        break;
      case 'about':
        router.push('/(profile)/edit-about');
        break;
      case 'info':
        router.push('/(profile)/edit-info');
        break;
      case 'location':
        router.push('/(profile)/edit-location');
        break;
      case 'interests':
        router.push('/(profile)/edit-interests');
        break;
      case 'prompts':
        router.push('/(profile)/edit-prompts');
        break;
      case 'verification':
        router.push('/(profile)/verification');
        break;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-slate-50">
        {/* Header */}
        <View className="flex-row justify-between items-center p-4 border-b border-slate-200">
          <TouchableOpacity onPress={onClose}>
            <Text className="text-indigo-600">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold">Edit Profile</Text>
          <TouchableOpacity onPress={onSave}>
            <Text className="text-indigo-600">Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1">
          {/* Profile Preview */}
          <View className="bg-white p-6 mb-6">
            <View className="items-center">
              <Image
                source={{ uri: userData.photos[0] }}
                className="w-24 h-24 rounded-full mb-4"
              />
              <Text className="text-xl font-semibold mb-1">
                {userData.name}, {userData.age}
              </Text>
              <View className="flex-row items-center">
                <Ionicons name="location" size={16} color="#64748b" />
                <Text className="text-slate-600 ml-1">
                  {userData.location.district}, {userData.location.state}
                </Text>
              </View>
            </View>
          </View>

          {/* Edit Sections */}
          <View className="px-4">
            <EditSection
              title="Profile Photos"
              subtitle="Add and arrange your photos"
              icon="images-outline"
              onPress={() => handleEditSection('photos')}
            />
            <EditSection
              title="Basic Info"
              subtitle="Edit your personal information"
              icon="person-outline"
              onPress={() => handleEditSection('info')}
            />
            <EditSection
              title="About Me"
              subtitle="Tell others about yourself"
              icon="book-outline"
              onPress={() => handleEditSection('about')}
            />
            <EditSection
              title="Location"
              subtitle="Update your location"
              icon="location-outline"
              onPress={() => handleEditSection('location')}
            />
            <EditSection
              title="Interests"
              subtitle="What do you like to do?"
              icon="heart-outline"
              onPress={() => handleEditSection('interests')}
            />
            <EditSection
              title="Prompts"
              subtitle="Add prompts to your profile"
              icon="chatbubble-outline"
              onPress={() => handleEditSection('prompts')}
            />
            
            {/* Verification Section */}
            <TouchableOpacity
              onPress={() => handleEditSection('verification')}
              className="bg-primary-50 p-4 rounded-xl mb-4"
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-primary-100 rounded-full items-center justify-center">
                    <Ionicons name="shield-checkmark" size={20} color="#6366f1" />
                  </View>
                  <View className="ml-3">
                    <Text className="text-lg font-semibold text-primary-600">Get Verified</Text>
                    <Text className="text-slate-600">Verify your profile for more matches</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#6366f1" />
              </View>
            </TouchableOpacity>

            {/* Non-editable info */}
            <View className="bg-slate-100 p-4 rounded-xl mb-4">
              <Text className="text-lg font-semibold mb-4 text-slate-800">
                Non-editable Information
              </Text>
              <NonEditableField label="Member Since" value={userData.joinedDate} />
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

function EditSection({ 
  title, 
  subtitle, 
  icon, 
  onPress 
}: { 
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity 
      onPress={onPress}
      className="bg-white p-4 rounded-xl mb-4"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-10 h-10 bg-slate-100 rounded-full items-center justify-center">
            <Ionicons name={icon as any} size={20} color="#64748b" />
          </View>
          <View className="ml-3">
            <Text className="text-lg font-semibold mb-1">{title}</Text>
            <Text className="text-slate-500">{subtitle}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#94a3b8" />
      </View>
    </TouchableOpacity>
  );
}

function NonEditableField({ label, value }: { label: string; value: string | number }) {
  return (
    <View className="mb-4">
      <Text className="text-slate-500">{label}</Text>
      <Text className="text-slate-800 font-medium">{value}</Text>
    </View>
  );
} 