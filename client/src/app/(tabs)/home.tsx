import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity, FlatList } from "react-native";
import { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import TabHeader from "@/src/components/shared/TabHeader";
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from "expo-blur";
import Animated, { FadeInDown } from 'react-native-reanimated';
import React from "react";

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

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 2000);
  };

  const renderTripCard = ({ item }: { item: any }) => (
    <Animated.View 
      entering={FadeInDown.delay(200)}
      className="mr-4 w-[300px]"
    >
      <BlurView intensity={20} className="rounded-3xl overflow-hidden">
        <Image 
          source={{ uri: item.image }}
          className="w-full h-[200px]"
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.9)']}
          className="absolute bottom-0 w-full p-5"
        >
          <View className="flex-row items-center mb-2">
            <View className="bg-white/20 px-3 py-1 rounded-full flex-row items-center">
              <Ionicons name="calendar" size={14} color="#fff" />
              <Text className="text-white ml-2 font-montserrat">{item.startDate}</Text>
            </View>
            <View className="bg-white/20 px-3 py-1 rounded-full flex-row items-center ml-2">
              <Ionicons name="time" size={14} color="#fff" />
              <Text className="text-white ml-2 font-montserrat">{item.duration}</Text>
            </View>
          </View>
          
          <Text className="text-white text-xl font-youngSerif mb-2">{item.title}</Text>
          
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-lg font-montserratMedium">{item.price}</Text>
            <View className="flex-row items-center bg-white/20 px-3 py-1 rounded-full">
              <Ionicons name="star" size={14} color="#D6A655" />
              <Text className="text-white ml-2 font-montserrat">{item.rating}</Text>
            </View>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );

  const renderGroupCard = ({ item }: { item: any }) => (
    <TouchableOpacity 
      onPress={() => {
        // Use try-catch to handle any navigation errors
        try {
          router.push({
            pathname: "/group-chat/[id]",
            params: { id: item.id }
          });
        } catch (error) {
          console.log("Navigation error:", error);
          // Fallback direct approach if the above fails
          router.navigate(`/group-chat/${item.id}`);
        }
      }}
      className="mr-4 w-[220px]"
    >
      <LinearGradient
        colors={[item.color, `${item.color}88`]}
        className="rounded-2xl overflow-hidden"
      >
        <View className="h-[120px] items-center justify-center">
          <Ionicons name="people" size={40} color="white" />
        </View>
        <View className="p-3">
          <Text className="text-white font-montserratMedium mb-1">{item.name}</Text>
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Ionicons name="people" size={14} color="#fff" />
              <Text className="text-white text-sm ml-1 font-montserrat">{item.members} members</Text>
            </View>
            <TouchableOpacity 
              className="bg-white/20 px-3 py-1 rounded-full"
            >
              <Text className="text-white text-sm font-montserrat">Join</Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row items-center mt-2">
            <Ionicons name="airplane-outline" size={14} color="#fff" />
            <Text className="text-white text-sm ml-1 font-montserrat">{item.nextTrip}</Text>
          </View>
          <View className="flex-row items-center mt-1">
            <Ionicons name="calendar-outline" size={14} color="#fff" />
            <Text className="text-white text-sm ml-1 font-montserrat">{item.date}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-primary">
      <LinearGradient
        colors={['rgba(125, 91, 166, 0.9)', 'rgba(90, 65, 128, 0.8)']}
        className="flex-1"
      >
        <TabHeader
          title="Explore"
          leftIcon="compass-outline"
          rightIcon="notifications-outline"
          onLeftPress={() => router.push("/explore")}
          onRightPress={() => router.push("/notifications")}
          gradientColors={['rgba(125, 91, 166, 0.9)', 'rgba(90, 65, 128, 0.8)']}
        />
      
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor="#fff"
            />
          }
          contentContainerStyle={{ padding: 16 }}
        >   
          {/* Custom Trip Card */}
          <TouchableOpacity 
            onPress={() => router.push("/(icon)/custom-trip")}
            className="mt-6"
          >
            <LinearGradient
              colors={['#50A6A7', '#398788']}
              className="rounded-3xl p-6"
            >
              <View className="flex-row justify-between items-center">
                <View className="flex-1">
                  <Text className="text-white text-2xl font-youngSerif mb-2">
                    Create Your Dream Trip
                  </Text>
                  <Text className="text-white/80 font-montserrat">
                    Customize every detail of your journey
                  </Text>
                </View>
                <View className="bg-white/20 p-3 rounded-2xl">
                  <Ionicons name="airplane" size={24} color="#fff" />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Recommended Trips */}
          <View className="mb-8">
            <Text className="text-2xl font-youngSerif text-white mb-4 mt-8">
              Recommended Trips
            </Text>
            <FlatList
              data={RECOMMENDED_TRIPS}
              renderItem={renderTripCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
            />
          </View>

          {/* Travel Groups */}
          <View className="mt-8">
            <Text className="text-white text-xl font-youngSerif mb-4">
              Travel Groups
            </Text>
            <FlatList
              data={TRAVEL_GROUPS}
              renderItem={renderGroupCard}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={item => item.id}
            />
          </View>

          {/* Upcoming Events */}
          <View className="mt-8 mb-8">
            <Text className="text-white text-xl font-youngSerif mb-4">
              Upcoming Events
            </Text>
            {UPCOMING_EVENTS.map(event => (
              <TouchableOpacity 
                key={event.id}
                onPress={() => {
                  try {
                    console.log("Navigating to event:", event.id);
                    // We're just logging for now since we don't have actual event screens
                  } catch (error) {
                    console.log("Navigation error:", error);
                  }
                }}
                className="mb-4"
              >
                <BlurView intensity={20} className="rounded-2xl overflow-hidden">
                  <Image 
                    source={{ uri: event.image }}
                    className="w-full h-[120px]"
                  />
                  <View className="p-4">
                    <Text className="text-white text-lg font-youngSerif mb-1">
                      {event.title}
                    </Text>
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <Ionicons name="location" size={14} color="#fff" />
                        <Text className="text-white ml-1 font-montserrat">{event.location}</Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="calendar" size={14} color="#fff" />
                        <Text className="text-white ml-1 font-montserrat">{event.date}</Text>
                      </View>
                    </View>
                  </View>
                </BlurView>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}