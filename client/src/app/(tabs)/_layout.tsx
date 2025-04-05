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
        color={focused ? "#7D5BA6" : "#9CA3AF"} // Use our primary color
      />
    );
  }, []);

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            height: 56, 
            borderTopWidth: 0,
            elevation: 8,
            shadowOpacity: 0.1,
            shadowRadius: 6,
            shadowOffset: { width: 0, height: -2 },
            paddingBottom: 8,
            paddingTop: 4,
          },
          tabBarActiveTintColor: "#7D5BA6",  // Primary color
          tabBarInactiveTintColor: "#9CA3AF", // Gray for inactive
          tabBarLabelStyle: {
            fontSize: 11, 
            fontFamily: 'Montserrat-Medium',
            marginTop: 2,
          },
          freezeOnBlur: true,
          // unmountOnBlur: true,
          tabBarBackground: () => (
            <LinearGradient
              colors={['#FFFFFF', '#F8F7FA']} // Light neutral gradient
              style={{ height: '100%' }}
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
    </>
  );
}
