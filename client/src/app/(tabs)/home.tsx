import React, { useState, useRef, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity, FlatList, Dimensions, Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from "expo-blur";
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate,
  withTiming
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Link, Href } from 'expo-router';

const { width, height } = Dimensions.get('window');
const SPRING_CONFIG = {
  damping: 15,
  stiffness: 150,
};
// Constants for bottom sheet
const BOTTOM_SHEET_MAX_HEIGHT = height * 0.4; // 40% of screen height
const BOTTOM_SHEET_MIN_HEIGHT = 0;
const BOTTOM_SHEET_SNAP_POINTS = {
  CLOSED: BOTTOM_SHEET_MIN_HEIGHT,
  OPEN: -BOTTOM_SHEET_MAX_HEIGHT
} as const;

// Mock Data
const RECOMMENDED_TRIPS = [
  {
    id: '1',
    title: 'Mystical Ladakh Adventure',
    image: 'https://images.unsplash.com/photo-1506038634487-60a69ae4b7b1',
    duration: '7 Days',
    price: '₹35,000',
    rating: 4.8,
    startDate: '15 Apr',
  },
  {
    id: '2',
    title: 'Kerala Backwaters Escape',
    image: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944',
    duration: '5 Days',
    price: '₹25,000',
    rating: 4.9,
    startDate: '20 Apr',
  },
  {
    id: '3',
    title: 'Rajasthan Royal Tour',
    image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41',
    duration: '8 Days', 
    price: '₹45,000',
    rating: 4.7,
    startDate: '5 May',
  },
  {
    id: '4',
    title: 'Northeast Explorer',
    image: 'https://images.unsplash.com/photo-1580889240912-c39ecefd3d95',
    duration: '10 Days',
    price: '₹55,000', 
    rating: 4.9,
    startDate: '12 May',
  },
  {
    id: '5',
    title: 'Andaman Island Hopping',
    image: 'https://images.unsplash.com/photo-1589179447852-768c143a1144',
    duration: '6 Days',
    price: '₹40,000',
    rating: 4.8,
    startDate: '18 May',
  }
];

const TRAVEL_GROUPS = [
  {
    id: '1',
    name: 'Himalayan Trekkers',
    members: 128,
    nextTrip: 'Manali to Leh',
    date: '25 Apr',
    color: '#8a3ab9'
  },
  {
    id: '2',
    name: 'Beach Hoppers',
    members: 95,
    nextTrip: 'Goa Weekend',
    date: '1 May',
    color: '#4c68d7'
  },
  {
    id: '3',
    name: 'Rajasthan Royal Tour',
    members: 128,
    nextTrip: 'Jaipur Weekend',
    date: '25 Apr',
    color: '#cd486b'
  },
  {
    id: '4',
    name: 'Northeast Explorer',
    members: 128,
    nextTrip: 'Meghalaya Trip',
    date: '1 May',
    color: '#517fa4'
  },
  {
    id: '5',
    name: 'Andaman Island Hopping',
    members: 128,
    nextTrip: 'Port Blair',
    date: '1 May',
    color: '#5851DB'
  }
];

const UPCOMING_EVENTS = [
  {
    id: '1',
    title: 'Summer Festival',
    location: 'Manali',
    date: '10 May',
    image: 'https://images.unsplash.com/photo-1533659828870-95ee305cee3e',
    attendees: 250,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useSharedValue(0);
  const bottomSheetTranslateY = useSharedValue(0);
  const isBottomSheetActive = useSharedValue(false);
  const startY = useSharedValue(0);

  // Handle refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 2000);
  }, []);

  // Gesture handler for bottom sheet
  const gesture = Gesture.Pan()
    .onStart((event) => {
      isBottomSheetActive.value = true;
      startY.value = event.absoluteY;
    })
    .onUpdate((event) => {
      const deltaY = event.absoluteY - startY.value;
      let newTranslateY = deltaY;

      // If sheet was already open, adjust the translation
      if (bottomSheetTranslateY.value === BOTTOM_SHEET_SNAP_POINTS.OPEN) {
        newTranslateY += BOTTOM_SHEET_SNAP_POINTS.OPEN;
      }

      // Clamp the values
      bottomSheetTranslateY.value = Math.max(
        BOTTOM_SHEET_SNAP_POINTS.OPEN,
        Math.min(BOTTOM_SHEET_SNAP_POINTS.CLOSED, newTranslateY)
      );
    })
    .onEnd((event) => {
      const velocity = event.velocityY;
      const shouldClose = 
        velocity > 500 || // Quick flick down
        (bottomSheetTranslateY.value > BOTTOM_SHEET_SNAP_POINTS.OPEN / 2 && velocity > -500); // Slower drag but past halfway

      if (shouldClose) {
        bottomSheetTranslateY.value = withSpring(BOTTOM_SHEET_SNAP_POINTS.CLOSED, {
          ...SPRING_CONFIG,
          velocity: velocity
        });
      } else {
        bottomSheetTranslateY.value = withSpring(BOTTOM_SHEET_SNAP_POINTS.OPEN, {
          ...SPRING_CONFIG,
          velocity: velocity
        });
      }
      isBottomSheetActive.value = false;
    });

  const bottomSheetStyle = useAnimatedStyle(() => {
    const borderRadius = interpolate(
      bottomSheetTranslateY.value,
      [BOTTOM_SHEET_SNAP_POINTS.OPEN, BOTTOM_SHEET_SNAP_POINTS.CLOSED],
      [32, 0]
    );

    return {
      transform: [{ translateY: bottomSheetTranslateY.value }],
      borderTopLeftRadius: borderRadius,
      borderTopRightRadius: borderRadius,
    };
  });

  const overlayStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      bottomSheetTranslateY.value,
      [BOTTOM_SHEET_SNAP_POINTS.CLOSED, BOTTOM_SHEET_SNAP_POINTS.OPEN],
      [0, 0.5],
      Extrapolate.CLAMP
    );

    return {
      opacity,
      display: opacity === 0 ? 'none' : 'flex',
    };
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0],
      Extrapolate.CLAMP
    );
    const scale = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.9],
      Extrapolate.CLAMP
    );
    return {
      opacity,
      transform: [{ scale }],
    };
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F7F9FC]">
      {/* Overlay for bottom sheet */}
      <Animated.View 
        style={[
          {
            ...StyleSheet.absoluteFillObject,
            backgroundColor: 'black',
          },
          overlayStyle
        ]} 
        pointerEvents={isBottomSheetActive.value ? "auto" : "none"}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFill}
          onPress={() => {
            bottomSheetTranslateY.value = withSpring(BOTTOM_SHEET_SNAP_POINTS.CLOSED, SPRING_CONFIG);
          }}
        />
      </Animated.View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          scrollY.value = event.nativeEvent.contentOffset.y;
        }}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#4ECDC4"
          />
        }
      >
        {/* Hero Section */}
        <Animated.View style={headerStyle} className="px-6 pt-4">
          <LinearGradient
            colors={['#4ECDC4', '#45B7D1']}
            className="rounded-3xl p-6 mb-8"
          >
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-white/80 font-montserrat mb-2">Welcome back</Text>
                <Text className="text-white text-2xl font-youngSerif">John Doe</Text>
              </View>
              <TouchableOpacity 
                onPress={() => router.push("/notifications")}
                className="bg-white/20 p-3 rounded-2xl"
              >
                <Ionicons name="notifications-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>

          </LinearGradient>
        </Animated.View>

        {/* Content Sections */}
        <View className="px-6">
          {/* Featured Trips */}
          <View className="mb-8">
            <Text className="text-2xl font-youngSerif text-[#2C3E50] mb-4">
              Featured Trips
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="space-x-4"
            >
              {RECOMMENDED_TRIPS.map((trip, index) => (
                <Animated.View 
                  key={trip.id}
                  entering={FadeInDown.delay(index * 100)}
                  className="w-[280px]"
                >
                  <TouchableOpacity className="relative">
                    <Image 
                      source={{ uri: trip.image }}
                      className="w-full h-[200px] rounded-3xl"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.8)']}
                      className="absolute bottom-0 w-full p-4 rounded-b-3xl"
                    >
                      <Text className="text-white font-youngSerif text-lg mb-2">
                        {trip.title}
                      </Text>
                      <View className="flex-row justify-between items-center">
                        <View className="flex-row items-center">
                          <Ionicons name="calendar-outline" size={16} color="white" />
                          <Text className="text-white ml-2 font-montserrat">
                            {trip.startDate}
                          </Text>
                        </View>
                        <Text className="text-white font-montserratBold">
                          {trip.price}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </View>

          {/* Travel Groups */}
          <View className="mb-8">
            <Text className="text-2xl font-youngSerif text-[#2C3E50] mb-4">
              Travel Groups
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              className="space-x-4"
            >
              {TRAVEL_GROUPS.map((group, index) => (
                <Animated.View 
                  key={group.id}
                  entering={FadeInUp.delay(index * 100)}
                  className="w-[200px]"
                >
                  <TouchableOpacity>
                    <LinearGradient
                      colors={[group.color, `${group.color}88`]}
                      className="p-4 rounded-2xl"
                    >
                      <View className="flex-row items-center mb-3">
                        <View className="bg-white/20 p-2 rounded-xl">
                          <Ionicons name="people" size={20} color="white" />
                        </View>
                        <Text className="text-white font-montserratBold ml-2">
                          {group.members} members
                        </Text>
                      </View>
                      <Text className="text-white font-youngSerif text-lg mb-2">
                        {group.name}
                      </Text>
                      <Text className="text-white/80 font-montserrat mb-3">
                        {group.nextTrip}
                      </Text>
                      <View className="flex-row items-center">
                        <Ionicons name="calendar-outline" size={16} color="white" />
                        <Text className="text-white ml-2 font-montserrat">
                          {group.date}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </ScrollView>
          </View>

          {/* Upcoming Events */}
          <View className="mb-8">
            <Text className="text-2xl font-youngSerif text-[#2C3E50] mb-4">
              Upcoming Events
            </Text>
            {UPCOMING_EVENTS.map((event, index) => (
              <Animated.View 
                key={event.id}
                entering={FadeInDown.delay(index * 100)}
                className="mb-4"
              >
                <TouchableOpacity className="relative">
                  <Image 
                    source={{ uri: event.image }}
                    className="w-full h-[150px] rounded-2xl"
                  />
                  <BlurView intensity={20} className="absolute bottom-0 w-full p-4 rounded-b-2xl">
                    <Text className="text-white font-youngSerif text-lg mb-2">
                      {event.title}
                    </Text>
                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center">
                        <Ionicons name="location-outline" size={16} color="white" />
                        <Text className="text-white ml-2 font-montserrat">
                          {event.location}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="calendar-outline" size={16} color="white" />
                        <Text className="text-white ml-2 font-montserrat">
                          {event.date}
                        </Text>
                      </View>
                    </View>
                  </BlurView>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>   
              
    </SafeAreaView>
  );
}