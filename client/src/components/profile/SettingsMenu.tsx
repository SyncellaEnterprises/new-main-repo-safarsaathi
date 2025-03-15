import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

interface SettingsMenuProps {
  visible: boolean;
  onClose: () => void;
}

type RouteType = 
  | '/(profile)/edit-photos'
  | '/(profile)/edit-info'
  | '/(profile)/edit-location'
  | '/(profile)/edit-interests'
  | '/(profile)/edit-prompts'
  | '/(profile)/verification'
  | '/(profile)/(settings)/app-permissions'
  | '/(profile)/(settings)/language'
  | '/(profile)/(settings)/privacy'
  | '/(help)/account-issues'
  | '/(help)/account-security'
  | '/(help)/finding-matches'
  | '/(help)/data-usage'
  | '/(help)/payment-questions'
  | '/(help)/privacy-settings'
  | '/(help)/profile-setup'
  | '/(help)/safety-tips'
  | '/(help)/technical-problems';

interface MenuItem {
  label: string;
  icon: string;
  route: RouteType;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

export default function SettingsMenu({ visible, onClose }: SettingsMenuProps) {
  const router = useRouter();

  const settingsOptions: MenuSection[] = [
    {
      title: 'Profile Settings',
      items: [
        { label: 'Edit Photos', icon: 'images', route: '/(profile)/edit-photos' },
        { label: 'Edit Info', icon: 'person', route: '/(profile)/edit-info' },
        { label: 'Edit Location', icon: 'location', route: '/(profile)/edit-location' },
        { label: 'Edit Interests', icon: 'heart', route: '/(profile)/edit-interests' },
        { label: 'Edit Prompts', icon: 'chatbubble', route: '/(profile)/edit-prompts' },
        { label: 'Verification', icon: 'shield-checkmark', route: '/(profile)/verification' },
      ]
    },
    {
      title: 'App Settings',
      items: [
        { label: 'App Permissions', icon: 'settings', route: '/(profile)/(settings)/app-permissions' },
        { label: 'Language', icon: 'language', route: '/(profile)/(settings)/language' },
        { label: 'Privacy', icon: 'lock-closed', route: '/(profile)/(settings)/privacy' },
      ]
    },
    {
      title: 'Help & Support',
      items: [
        { label: 'Account Issues', icon: 'person-circle', route: '/(help)/account-issues' },
        { label: 'Account Security', icon: 'shield', route: '/(help)/account-security' },
        { label: 'Finding Matches', icon: 'people', route: '/(help)/finding-matches' },
        { label: 'Data Usage', icon: 'analytics', route: '/(help)/data-usage' },
        { label: 'Payment Questions', icon: 'card', route: '/(help)/payment-questions' },
        { label: 'Privacy Settings', icon: 'lock-closed', route: '/(help)/privacy-settings' },
        { label: 'Profile Setup', icon: 'create', route: '/(help)/profile-setup' },
        { label: 'Safety Tips', icon: 'warning', route: '/(help)/safety-tips' },
        { label: 'Technical Problems', icon: 'construct', route: '/(help)/technical-problems' },
      ]
    }
  ];

  const handleOptionPress = (route: RouteType) => {
    onClose();
    router.push(route);
  };

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
            <Text className="text-lg font-semibold text-slate-800">Settings</Text>
            <TouchableOpacity 
              onPress={onClose}
              className="w-8 h-8 items-center justify-center rounded-full bg-slate-100"
            >
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Settings List */}
          <ScrollView className="flex-1">
            {settingsOptions.map((section, sectionIndex) => (
              <View key={section.title} className={sectionIndex > 0 ? 'mt-6' : ''}>
                <Text className="px-4 py-2 text-sm font-medium text-slate-400 uppercase">
                  {section.title}
                </Text>
                <View className="bg-white">
                  {section.items.map((item, index) => (
                    <TouchableOpacity
                      key={item.label}
                      onPress={() => handleOptionPress(item.route)}
                      className={`flex-row items-center px-4 py-3 ${
                        index !== section.items.length - 1 ? 'border-b border-slate-100' : ''
                      }`}
                    >
                      <View className="w-8 h-8 bg-indigo-50 rounded-full items-center justify-center">
                        <Ionicons name={item.icon as any} size={16} color="#6366f1" />
                      </View>
                      <Text className="flex-1 ml-3 text-slate-700">{item.label}</Text>
                      <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}
            <View className="h-8" />
          </ScrollView>
        </Animated.View>
      </BlurView>
    </Modal>
  );
} 