import React from 'react';
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar, View, TouchableOpacity, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const { width } = Dimensions.get('window');

// Icon mapping type
type IconMapping = {
  [key: string]: {
    active: string;
    inactive: string;
  };
};

// Define icon mapping
const TAB_ICONS: IconMapping = {
  chat: {
    active: "chatbubble",
    inactive: "chatbubble-outline"
  },
  explore: {
    active: "compass",
    inactive: "compass-outline"
  },
  home: {
    active: "home",
    inactive: "home-outline"
  },
  location: {
    active: "map",
    inactive: "map-outline"
  },
  profile: {
    active: "person",
    inactive: "person-outline"
  }
};

function CustomTabBar({ state, descriptors, navigation }: { state: any, descriptors: any, navigation: any }) {
  return (
    <View style={styles.fabTabBarContainer}>
      {/* Wavy Top SVG */}
      <LinearGradient
        colors={["#F8F7FA", "#FDF6E3"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fabTabBar}
      >
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          
          const label = options.tabBarLabel ?? options.title ?? route.name;
          const routeName = route.name.toLowerCase();
          
          const iconName = TAB_ICONS[routeName]?.[isFocused ? 'active' : 'inactive'] ?? "ellipse";

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              // Standard navigation for all tabs
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.fabTabButton}
              activeOpacity={0.8}
            >
              <View style={[styles.iconCircle, isFocused && styles.iconCircleActive]}>
                <Ionicons
                  name={iconName as any}
                  size={isFocused ? 32 : 26}
                  color={isFocused ? "#7D5BA6" : "#A0AEC0"}
                />
              </View>
              {isFocused && (
                <Text style={styles.fabTabLabel}>{label}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </LinearGradient>
    </View>
  );
}

export default function TabLayout() {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <Tabs
        screenOptions={{
          headerShown: false,
          freezeOnBlur: true,
        }}
        tabBar={props => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="home" options={{ title: "Home" }} />
        <Tabs.Screen name="explore" options={{ title: "Explore" }} />
        <Tabs.Screen name="location" options={{ title: "Maps" }} />
        <Tabs.Screen name="chat" options={{ title: "Chat" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  wavyTop: {
    position: 'absolute',
    top: -24
  },
  fabTabBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: Platform.OS === 'ios' ? 18 : 8,
    alignItems: 'center',
    zIndex: 100,
  },
  fabTabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 32,
    backgroundColor: 'transparent',
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#7D5BA6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 12,
    minWidth: width - 32,
  },
  fabTabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(125,91,166,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  iconCircleActive: {
    backgroundColor: '#F3E8FF',
    shadowColor: '#7D5BA6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  fabTabLabel: {
    fontSize: 13,
    color: '#7D5BA6',
    fontFamily: 'Montserrat-Bold',
    marginTop: 2,
    letterSpacing: 0.2,
  },
});
