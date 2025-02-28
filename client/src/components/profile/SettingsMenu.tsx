import React from "react";
import { View, Text, TouchableOpacity, Modal, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, useRouter } from "expo-router";
import { BlurView } from "expo-blur";
import { useState, useRef, useEffect } from "react";

interface SettingsMenuItem {
  icon: string;
  label: string;
  route?: string;
  action?: () => void;
  color?: string;
}

const MENU_ITEMS: SettingsMenuItem[] = [
//   {
//     icon: "person-circle-outline",
//     label: "Edit Profile",
//     route: "/(tabs)/profile/edit"
//   },
  {
    icon: "settings-outline",
    label: "Settings",
    route: "/(icon)/settings"
  },
  {
    icon: "shield-checkmark-outline",
    label: "Privacy",
    route: "/(settings)/privacy"
  },
  {
    icon: "notifications-outline",
    label: "Notifications",
    route: "/(settings)/notifications"
  },
  {
    icon: "help-circle-outline",
    label: "Help Center",
    route: "/(icon)/help"
  },
  {
    icon: "lock-closed-outline",
    label: "Account Security",
    route: "/(help)/account-security"
  },
  {
    icon: "log-out-outline",
    label: "Log Out",
    color: "#ef4444",
    action: () => {router.push("/auth/login")}
  },
];

interface SettingsMenuProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsMenu({ visible, onClose }: SettingsMenuProps) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);
  

  const handlePress = (item: SettingsMenuItem) => {
    onClose();
    if (item.route) {
      router.push(item.route);
    } else if (item.action) {
      item.action();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} className="flex-1">
        <TouchableOpacity 
          className="flex-1" 
          onPress={onClose}
          activeOpacity={1}
        >
          <Animated.View
            className="absolute right-4 top-20 w-72 rounded-2xl overflow-hidden bg-[#1a237e]/95"
            style={{
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
              ],
              opacity: slideAnim,
            }}
          >
            {MENU_ITEMS.map((item, index) => (
              <TouchableOpacity
                key={item.label}
                onPress={() => handlePress(item)}
                className={`flex-row items-center p-4 ${
                  index !== MENU_ITEMS.length - 1 ? "border-b border-white/10" : ""
                }`}
              >
                <Ionicons 
                  name={item.icon as any} 
                  size={24} 
                  color={item.color || "#fff"} 
                />
                <Text 
                  className={`ml-3 text-base ${
                    item.color ? `text-[${item.color}]` : "text-white"
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </TouchableOpacity>
      </BlurView>
    </Modal>
  );
} 