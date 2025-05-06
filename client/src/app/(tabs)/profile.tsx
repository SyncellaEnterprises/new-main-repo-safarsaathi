import React, { useState, useEffect, useCallback } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator, SafeAreaView, ScrollView, RefreshControl, Dimensions, Platform, TextInput, StatusBar, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { router, useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  SlideInDown,
  withSpring,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolate,
  Extrapolate,
  FadeInRight,
  ZoomIn,
  BounceIn
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuth } from "@/src/context/AuthContext";
import { MotiView } from 'moti';
import IMAGES from "@/src/constants/images";
import { useToast } from "@/src/context/ToastContext";

const { width, height } = Dimensions.get('window');

// Set API URL based on platform and environment
const API_URL = __DEV__ 
  ? Platform.select({
    ios: 'http://localhost:5000/api',
    android: 'http://10.0.2.2:5000/api',
  })
  : 'https://your-production-api.com/api';

// User profile interface
interface UserProfile {
  username: string;
  user_id: number;
  email: string;
  age?: number;
  bio?: string;
  created_at?: string;
  gender?: string;
  interest?: string[] | string;
  location?: string;
  isverified?: boolean;
  level?: number;
  occupation?: string;
  profile_photo?: string | null;
  images?: string | null;
  prompts?: {
    prompts: Array<{
      question: string;
      answer: string;
    }>;
  };
  trusted_contacts?: Array<{
    id: number;
    name: string;
    number: string;
    relationship: string;
  }>;
}

// Add new interface for form data
interface TrustedContactForm {
  name: string;
  number: string;
  relationship: string;
}

// Add this after the UserProfile interface
interface MenuOption {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  action?: () => void;
}

// Add this before the ProfileScreen component
const MENU_OPTIONS: MenuOption[] = [
  {
    title: "App Permissions",
    icon: "shield-checkmark-outline",
    route: "/(settings)/app-permissions",
  },
  {
    title: "Privacy",
    icon: "lock-closed-outline",
    route: "/(settings)/privacy",
  },
  {
    title: "Language",
    icon: "language-outline",
    route: "/(settings)/language",
  }
];

const BADGES = [
  { id: 1, name: 'Verified', icon: 'shield-check', color: '#10B981' },
];

const QUICK_ACTIONS = [
  { id: 1, name: 'Edit Profile', icon: 'edit-2', color: '#7C3AED', route: '/(profile)' },
  { id: 2, name: 'Settings', icon: 'settings', color: '#06B6D4', route: '/(settings)/app-permissions' },
  { id: 3, name: 'Share', icon: 'share-2', color: '#F59E0B', action: () => {} },
];

export default function ProfileScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    number: '',
    relationship: ''
  });
  const [isBottomSheetVisible, setIsBottomSheetVisible] = useState(false);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState('about');
  const scrollY = useSharedValue(0);
  const headerScale = useSharedValue(1);
  const headerTranslateY = useSharedValue(0);

  // Animation values
  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });
  const headerOpacity = useSharedValue(1);

  // Update header opacity animation
  const headerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(scrollY.value > 50 ? 0 : 1)
  }));

  const contentStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 100],
      [0, -50],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }]
    };
  });

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await axios.get(`${API_URL}/users/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.data.status === 'success') {
        setProfile(response.data.user);
        
        // Log location data for debugging
        if (response.data.user.location) {
          console.log('Received location data:', response.data.user.location);
          const locationString = getLocationString(response.data.user.location);
          console.log('Processed location string:', locationString);
        } else {
          console.log('No location data received in profile');
        }
      } else {
        throw new Error('Failed to fetch profile data');
      }
    } catch (err: any) {
      setError(err.message || 'An unknown error occurred');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchProfile();
    setRefreshing(false);
  }, []);

  // Update the location display logic with better error handling and debugging
  const getLocationString = (locationData: string | undefined): string => {
    if (!locationData) return '';
    
    try {
      console.log("Raw location data:", locationData);
      
      // Clean the location string if needed (remove escape characters)
      let cleanedLocationData = locationData.replace(/\\/g, '');
      
      // Parse the JSON string into an object
      const parsedLocation = JSON.parse(cleanedLocationData);
      console.log("Parsed location:", parsedLocation);
      
      if (parsedLocation.city && parsedLocation.state) {
        return `${parsedLocation.city}, ${parsedLocation.state}`;
      } else if (parsedLocation.city) {
        return parsedLocation.city;
      } else if (parsedLocation.state) {
        return parsedLocation.state;
      }
      
      // If we have an object but no city/state props, stringify it for debugging
      console.log("No city/state found in:", JSON.stringify(parsedLocation));
      return '';
    } catch (error) {
      console.error('Error parsing location:', error, locationData);
      // If JSON parsing fails, try to extract data using regex
      try {
        const cityMatch = locationData.match(/"city"\s*:\s*"([^"]+)"/);
        const stateMatch = locationData.match(/"state"\s*:\s*"([^"]+)"/);
        
        const city = cityMatch ? cityMatch[1] : '';
        const state = stateMatch ? stateMatch[1] : '';
        
        if (city && state) return `${city}, ${state}`;
        if (city) return city;
        if (state) return state;
      } catch (e) {
        console.error('Regex extraction failed:', e);
      }
      
      return '';
    }
  };

  // Process interests to get array
  const getInterestsArray = (interests: string | string[] | undefined): string[] => {
    if (!interests) return [];
    if (Array.isArray(interests)) return interests;
    
    try {
      // If it's a string that looks like a JSON array or object
      if (typeof interests === 'string') {
        // Remove curly braces if they exist
        let cleanedString = interests;
        if (cleanedString.startsWith('{') && cleanedString.endsWith('}')) {
          cleanedString = cleanedString.substring(1, cleanedString.length - 1);
        }
        
        // Check if it's now like a JSON array or just a comma-separated list
        if (cleanedString.startsWith('[') && cleanedString.endsWith(']')) {
          return JSON.parse(cleanedString);
        } else {
          // Split by commas, and clean each item
          return cleanedString.split(',').map(item => {
            let cleaned = item.trim();
            // Remove any surrounding quotes
            if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || 
                (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
              cleaned = cleaned.substring(1, cleaned.length - 1);
            }
            return cleaned;
          }).filter(item => item.length > 0); // Filter out any empty items
        }
      }
      
      // Fallback: just return as single item
      return [interests];
    } catch (error) {
      console.error('Error parsing interests:', error);
      // Fallback to simple string
      return [interests];
    }
  };

  const openSection = (section: string) => {
    setSelectedSection(section);
    setIsBottomSheetVisible(true);
  };

  const closeForm = () => {
    setIsBottomSheetVisible(false);
    setSelectedSection(null);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      number: '',
      relationship: ''
    });
    setCurrentStep(1);
  };

  const handleNextStep = () => {
    if (currentStep === 1 && !formData.name) {
      setError('Please enter contact name');
      return;
    }
    if (currentStep === 2 && !formData.number) {
      setError('Please enter phone number');
      return;
    }
    setCurrentStep(prev => prev + 1);
  };

  const handleBackStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else {
      closeForm();
    }
  };

  const handleAddContact = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        setError('No access token found');
        return;
      }

      if (currentStep === 1 && !formData.name) {
        setError('Please enter contact name');
        return;
      }
      if (currentStep === 2 && !formData.number) {
        setError('Please enter phone number');
        return;
      }
      if (currentStep === 3) {
        if (!formData.relationship) {
          setError('Please enter relationship');
          return;
        }

        const response = await axios.post(`${API_URL}/users/trusted-contacts`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.data.status === 'success') {
          resetForm();
          closeForm();
          await fetchProfile();
        }
      } else {
        handleNextStep();
      }
    } catch (err: any) {
      console.error('API Error:', err.response || err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add contact';
      setError(errorMessage);
    }
  };

  // Update the handleMenuItemPress function
  const handleMenuItemPress = async (option: MenuOption) => {
    setIsMenuVisible(false);
    if (option.route) {
      router.push(option.route as any);
    } else if (option.action) {
      option.action();
    }
  };

  // Add this function to handle sign out
  const handleSignOut = async () => {
    try {
      setIsMenuVisible(false); // Close the menu first
      await signOut();
      toast.show('Signed out successfully', 'info');
      router.replace("/auth");
      console.log('Signed out successfully');
    } catch (error) {
      console.error("Sign out error:", error);
      toast.show('Failed to sign out', 'error');
    }
  };

  // Add this function to handle quick action press
  const handleQuickActionPress = (action: typeof QUICK_ACTIONS[0]) => {
    if (action.route) {
      router.push(action.route as any);
    } else if (action.action) {
      action.action();
    }
  };

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-[#181825] items-center justify-center">
        {/* Premium Gradient Background */}
        <Animated.Image
          source={IMAGES.patternBg}
          style={{
            position: 'absolute',
            width: '120%',
            height: '120%',
            opacity: 0.10,
            top: '-10%',
            left: '-10%',
          }}
          resizeMode="cover"
        />
        <BlurView intensity={40} tint="dark" style={{ ...StyleSheet.absoluteFillObject, zIndex: 1 }}>
          <LinearGradient
            colors={["#7D5BA6", "#50A6A7", "#181825"]}
            style={{ ...StyleSheet.absoluteFillObject }}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 1, y: 1 }}
          />
        </BlurView>
        {/* Skeleton Profile Image */}
        <Animated.View entering={ZoomIn.springify()} style={{ alignItems: 'center', zIndex: 2 }}>
          <LinearGradient
            colors={["#7D5BA6", "#50A6A7"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', marginBottom: 24, opacity: 0.7 }}
          >
            <View style={{ width: 90, height: 90, borderRadius: 45, backgroundColor: '#2e2e3a' }} />
          </LinearGradient>
          {/* Skeleton Name */}
          <View style={{ width: 120, height: 22, borderRadius: 8, backgroundColor: '#2e2e3a', marginBottom: 12, opacity: 0.7 }} />
          {/* Skeleton Badges */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
            {[1,2,3].map(i => (
              <View key={i} style={{ width: 60, height: 20, borderRadius: 10, backgroundColor: '#2e2e3a', opacity: 0.6 }} />
            ))}
          </View>
          {/* Skeleton Stats */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
            {[1,2,3].map(i => (
              <View key={i} style={{ width: 60, height: 32, borderRadius: 12, backgroundColor: '#2e2e3a', opacity: 0.5 }} />
            ))}
          </View>
          {/* Skeleton Card */}
          <View style={{ width: 320, height: 120, borderRadius: 24, backgroundColor: '#232336', opacity: 0.5, marginBottom: 18 }} />
          <View style={{ width: 320, height: 80, borderRadius: 24, backgroundColor: '#232336', opacity: 0.4 }} />
        </Animated.View>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-neutral-light items-center justify-center p-4">
        <BlurView intensity={70} tint="light" className="p-8 rounded-3xl items-center">
          <Animated.View 
            entering={FadeIn.delay(300).springify()}
            className="items-center"
          >
            <Ionicons name="alert-circle" size={60} color="#EF4444" />
            <Text className="text-xl font-youngSerif text-neutral-darkest mt-4 text-center">{error}</Text>
            <TouchableOpacity 
              onPress={fetchProfile}
              className="mt-6 bg-primary px-8 py-3 rounded-2xl"
            >
              <Text className="text-white font-montserratMedium">Try Again</Text>
            </TouchableOpacity>
          </Animated.View>
        </BlurView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ScrollView 
        className="flex-1 bg-neutral-lightest"
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor="#7C3AED"
          />
        }
      >
        {/* Profile Header */}
        <View className="px-6 pt-4">
          <View className="flex-row justify-between items-center">
            <Text className="text-3xl font-youngSerif text-neutral-darkest">
              My Profile
            </Text>
            <TouchableOpacity 
              onPress={() => setIsMenuVisible(true)}
              className="w-10 h-10 bg-neutral-light rounded-full items-center justify-center"
            >
              <Feather name="more-horizontal" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Info */}
        <View className="px-6 mt-6">
          {/* Profile Image */}
          <View className="items-center">
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', delay: 300 }}
            >
              <LinearGradient
                colors={['#ffffff', '#ffffff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                className="w-32 h-32 rounded-full p-1"
              >
                <View className="w-full h-full rounded-full overflow-hidden border-4 border-white">
                  {profile?.profile_photo ? (
                    <Image
                      source={{ uri: profile.profile_photo }}
                      className="w-full h-full"
                      defaultSource={require('@/assets/images/safarsaathi.png')}
                    />
                  ) : (
                    <View className="w-full h-full bg-neutral-lightest items-center justify-center">
                      <Text className="text-4xl font-montserratBold text-primary">
                        {profile?.username?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                </View>
              </LinearGradient>
            </MotiView>

            {/* Name and Occupation */}
            <Animated.Text 
              entering={FadeInDown.delay(400).springify()}
              className="text-2xl font-youngSerif text-neutral-darkest mt-4"
            >
              {profile?.username || 'User'}
            </Animated.Text>
            
            {profile?.occupation && (
              <Animated.Text 
                entering={FadeInDown.delay(500).springify()}
                className="text-neutral-dark font-montserrat mt-1"
              >
                {profile.occupation}
              </Animated.Text>
            )}

            {/* Location */}
            {profile?.location && (
              <Animated.View 
                entering={FadeInDown.delay(600).springify()}
                className="flex-row items-center mt-3 bg-neutral-light px-4 py-2 rounded-full"
              >
                <Feather name="map-pin" size={16} color="#7C3AED" />
                <Text className="text-neutral-dark font-montserrat ml-2">
                  {getLocationString(profile.location) || "Location not available"}
                </Text>
              </Animated.View>
            )}

            {/* Badges */}
            <View className="flex-row mt-6 gap-3">
              {profile?.isverified ? (
                <Animated.View
                  entering={FadeInRight.delay(700).springify()}
                  className="bg-neutral-light rounded-full overflow-hidden"
                >
                  <View className="flex-row items-center px-4 py-2 space-x-2">
                    <MaterialCommunityIcons name="shield-check" size={18} color="#10B981" />
                    <Text className="text-sm font-montserratMedium text-neutral-darkest">
                      Verified
                    </Text>
                  </View>
                </Animated.View>
              ) : (
                <Animated.View
                  entering={FadeInRight.delay(700).springify()}
                  className="bg-neutral-light/80 rounded-full overflow-hidden"
                >
                  <TouchableOpacity 
                    onPress={() => router.push('/(profile)/verification' as any)}
                    className="flex-row items-center px-4 py-2 space-x-2"
                  >
                    <MaterialCommunityIcons name="shield-alert" size={18} color="#F97316" />
                    <Text className="text-sm font-montserratMedium text-neutral-darkest">
                      Get Verified
                    </Text>
                  </TouchableOpacity>
                </Animated.View>
              )}

              {/* Level Badge */}
              <Animated.View
                entering={FadeInRight.delay(800).springify()}
                className="bg-neutral-light rounded-full overflow-hidden"
              >
                <View className="flex-row items-center px-4 py-2 space-x-2">
                  <MaterialCommunityIcons 
                    name={
                      profile?.level === 2 ? "diamond" :
                      profile?.level === 1 ? "star" : 
                      "rocket"
                    } 
                    size={18} 
                    color="#7C3AED" 
                  />
                  <Text className="text-sm font-montserratMedium text-neutral-darkest">
                    {profile?.level === 2 ? "Experienced" :
                     profile?.level === 1 ? "Regular" :
                     "New"}
                  </Text>
                </View>
              </Animated.View>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="flex-row justify-around mt-8">
            {QUICK_ACTIONS.map((action, index) => (
              <Animated.View
                key={action.id}
                entering={ZoomIn.delay(800 + index * 100).springify()}
              >
                <TouchableOpacity 
                  className="items-center" 
                  onPress={() => handleQuickActionPress(action)}
                  activeOpacity={0.7}
                >
                  <LinearGradient
                    colors={['rgba(124, 58, 237, 0.1)', 'rgba(6, 182, 212, 0.1)']}
                    className="w-14 h-14 rounded-2xl items-center justify-center"
                  >
                    <Feather name={action.icon as any} size={22} color={action.color} />
                  </LinearGradient>
                  <Text className="text-xs font-montserratMedium text-neutral-dark mt-2">
                    {action.name}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Stats */}
          <View className="flex-row justify-between mt-8">
            {['Interests', 'Matches', 'Trips'].map((stat, index) => (
              <Animated.View
                key={stat}
                entering={FadeInDown.delay(900 + index * 100).springify()}
                className="flex-1 mx-2"
              >
                <TouchableOpacity>
                  <BlurView intensity={30} tint="light" className="rounded-2xl overflow-hidden">
                    <LinearGradient
                      colors={['rgba(124, 58, 237, 0.05)', 'rgba(6, 182, 212, 0.05)']}
                      className="p-4 items-center"
                    >
                      <Text className="text-2xl font-youngSerif text-primary">
                        {index === 0 ? getInterestsArray(profile?.interest).length : '0'}
                      </Text>
                      <Text className="text-sm font-montserratMedium text-neutral-dark mt-1">
                        {stat}
                      </Text>
                    </LinearGradient>
                  </BlurView>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>

          {/* Tabs */}
          <View className="mt-8 bg-white rounded-2xl shadow-sm">
            <View className="flex-row justify-around p-2">
              {['about', 'interests', 'prompts'].map((tab) => (
                <TouchableOpacity
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  className={`flex-1 items-center py-3 ${
                    activeTab === tab ? 'bg-primary/10 rounded-xl' : ''
                  }`}
                >
                  <Text
                    className={`font-montserratMedium capitalize ${
                      activeTab === tab ? 'text-primary' : 'text-neutral-dark'
                    }`}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Tab Content */}
          <View className="mt-6 mb-8">
            {activeTab === 'about' && (
              <Animated.View 
                entering={FadeIn.delay(100).springify()}
                className="bg-white rounded-3xl p-6 shadow-sm"
              >
                {/* Bio Section */}
                <View className="mb-6">
                  <Text className="text-lg font-montserratBold text-neutral-dark mb-2">
                    About Me
                  </Text>
                  <Text className="text-neutral-dark leading-relaxed font-montserrat">
                    {profile?.bio || 'No bio available yet. Tell others about yourself!'}
                  </Text>
                </View>
                
                {/* Location Section */}
                {profile?.location && (
                  <View className="mb-4">
                    <Text className="text-lg font-montserratBold text-neutral-dark mb-2">
                      Location
                    </Text>
                    <View className="flex-row items-center">
                      <Feather name="map-pin" size={18} color="#7C3AED" />
                      <Text className="text-neutral-dark font-montserrat ml-2 text-base">
                        {getLocationString(profile.location) || "Location not specified"}
                      </Text>
                    </View>
                  </View>
                )}
                
                {/* Age and Gender Section (if available) */}
                <View className="flex-row flex-wrap">
                  {profile?.age && (
                    <View className="mr-6 mb-2">
                      <Text className="text-sm font-montserratBold text-neutral-dark mb-1">
                        Age
                      </Text>
                      <Text className="text-neutral-dark font-montserrat">
                        {profile.age} years
                      </Text>
                    </View>
                  )}
                  
                  {profile?.gender && (
                    <View>
                      <Text className="text-sm font-montserratBold text-neutral-dark mb-1">
                        Gender
                      </Text>
                      <Text className="text-neutral-dark font-montserrat capitalize">
                        {profile.gender}
                      </Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            )}

            {activeTab === 'interests' && profile?.interest && (
              <Animated.View 
                entering={FadeIn.delay(100).springify()}
                className="bg-white rounded-3xl p-6 shadow-sm"
              >
                <Text className="text-lg font-montserratBold text-neutral-dark mb-4">
                  Things I enjoy
                </Text>
                
                <View className="flex-row flex-wrap gap-3">
                  {getInterestsArray(profile.interest).map((interest, index) => (
                    <Animated.View
                      key={index}
                      entering={FadeInDown.delay(200 + index * 50).springify()}
                    >
                      <LinearGradient
                        colors={['rgba(124, 58, 237, 0.1)', 'rgba(6, 182, 212, 0.1)']}
                        start={{x: 0, y: 0}}
                        end={{x: 1, y: 0}}
                        className="px-4 py-3 rounded-xl"
                      >
                        <View className="flex-row items-center">
                          <Feather name="heart" size={14} color="#7C3AED" style={{marginRight: 6}} />
                          <Text className="text-primary font-montserratMedium">
                            {interest.trim()}
                          </Text>
                        </View>
                      </LinearGradient>
                    </Animated.View>
                  ))}
                </View>
                
                {getInterestsArray(profile.interest).length === 0 && (
                  <Text className="text-neutral-dark font-montserrat text-center py-4">
                    No interests added yet.
                  </Text>
                )}
              </Animated.View>
            )}

            {activeTab === 'prompts' && profile?.prompts?.prompts && (
              <Animated.View 
                entering={FadeIn.delay(100).springify()}
                className="space-y-4"
              >
                {profile.prompts.prompts.map((prompt, index) => (
                  <Animated.View
                    key={index}
                    entering={FadeInDown.delay(200 + index * 100).springify()}
                    className="bg-white rounded-3xl p-6 shadow-sm"
                  >
                    <Text className="text-primary font-montserratBold mb-2">
                      {prompt.question}
                    </Text>
                    <Text className="text-neutral-dark font-montserrat">
                      {prompt.answer}
                    </Text>
                  </Animated.View>
                ))}
              </Animated.View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Menu Modal */}
      {isMenuVisible && (
        <View className="absolute inset-0 bg-black/50" style={{ zIndex: 50 }}>
          <TouchableOpacity 
            className="absolute inset-0"
            activeOpacity={0.5}
            onPress={() => setIsMenuVisible(false)}
          />
          <Animated.View 
            entering={SlideInDown}
            className="absolute top-20 right-4 bg-white rounded-2xl shadow-lg w-72"
            style={{ zIndex: 51 }}
          >
            {MENU_OPTIONS.map((option, index) => (
              <TouchableOpacity
                key={option.title}
                onPress={() => handleMenuItemPress(option)}
                activeOpacity={0.7}
                className="flex-row items-center px-4 py-3 border-b border-neutral-100"
              >
                <View className="w-8 h-8 bg-primary/10 rounded-full items-center justify-center">
                  <Ionicons name={option.icon} size={18} color="#7C3AED" />
                </View>
                <Text className="ml-3 font-montserratMedium text-neutral-dark">
                  {option.title}
                </Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity
              onPress={handleSignOut}
              activeOpacity={0.7}
              className="flex-row items-center px-4 py-3"
            >
              <View className="w-8 h-8 bg-red-100 rounded-full items-center justify-center">
                <Ionicons name="log-out-outline" size={18} color="#EF4444" />
              </View>
              <Text className="ml-3 font-montserratMedium text-red-500">
                Sign Out
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      )}

      {/* Loading State */}
      {loading && !refreshing && (
        <View className="absolute inset-0 bg-white items-center justify-center">
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text className="mt-4 font-montserratMedium text-neutral-dark">
            Loading profile...
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
}); 