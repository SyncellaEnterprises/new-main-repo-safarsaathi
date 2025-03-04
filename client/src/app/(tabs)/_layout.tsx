import React, { useCallback } from 'react';
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'react-native';

export default function TabLayout() {
  // Memoize the icon renderer for better performance
  const getTabIcon = useCallback((name: string, focused: boolean) => {
    const icons: { [key: string]: any } = {
      home: focused ? "home" : "home-outline",
      explore: focused ? "compass" : "compass-outline",
      location: focused ? "location" : "location-outline",
      chat: focused ? "chatbubble" : "chatbubble-outline",
      profile: focused ? "person" : "person-outline",
    };

    return (
      <Ionicons 
        name={icons[name]} 
        size={focused ? 26 : 22}  // Smaller, modern icon sizes
        color={focused ? "#1a237e" : "#B4B4B4"} // Subtle color changes for active state
      />
    );
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 56, // Keep the smaller height
          borderTopWidth: 0,
          elevation: 10, // Added elevation for a floating shadow effect
          shadowOpacity: 0.2, // Subtle shadow for floating appearance
          shadowRadius: 8, // More subtle shadow
          shadowOffset: { width: 0, height: -4 }, // Slight shadow offset for a lift effect
          paddingBottom: 10,
        },
        tabBarActiveTintColor: "#1a237e",  // Active icon color in dark blue
        tabBarInactiveTintColor: "#B4B4B4", // Grey for inactive icons
        tabBarLabelStyle: {
          fontSize: 11,  // Smaller font for labels
          fontWeight: '500',  // Medium weight for a modern feel
          marginTop: 4, // Slight margin for better spacing
        },
        freezeOnBlur: true,
        unmountOnBlur: true,
        tabBarBackground: () => (
          <LinearGradient
            colors={['#ffffff', '#f0f0f0']}  // Soft gradient for a minimal touch
            style={{ height: '100%', borderRadius: 12 }} // Rounded corners for the background
          />
        ),
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ focused }) => getTabIcon("home", focused),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: "Explore",
          tabBarIcon: ({ focused }) => getTabIcon("explore", focused),
        }}
      />
      <Tabs.Screen
        name="location"
        options={{
          title: "Maps",
          tabBarIcon: ({ focused }) => getTabIcon("location", focused),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ focused }) => getTabIcon("chat", focused),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => getTabIcon("profile", focused),
        }}
      />
    </Tabs>
  );
}
