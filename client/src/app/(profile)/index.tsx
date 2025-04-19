import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Image, SafeAreaView, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { INTEREST_CATEGORIES } from '@/src/constants/interests';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { MotiView, MotiText, AnimatePresence } from 'moti';
import { Skeleton } from 'moti/skeleton';
import { useHeaderHeight } from '@react-navigation/elements';
import { StatusBar } from 'expo-status-bar';

const { width } = Dimensions.get('window');

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
  occupation?: string;
  profile_photo?: string | null;
  prompts?: {
    prompts: Array<{
      question: string;
      answer: string;
    }>;
  };
}

// Gender options
const GENDERS = [
  { id: 'male', label: 'Male', icon: 'male', color: '#4A90E2' },
  { id: 'female', label: 'Female', icon: 'female', color: '#E85B81' },
  { id: 'non-binary', label: 'Non-binary', icon: 'transgender', color: '#9B59B6' },
  { id: 'other', label: 'Other', icon: 'person', color: '#50A6A7' },
];

// Occupation options
const OCCUPATIONS = [
  { id: 'student', label: 'Student', icon: 'school', color: '#4A90E2', description: 'Currently studying' },
  { id: 'professional', label: 'Professional', icon: 'briefcase', color: '#50A6A7', description: 'Working in a company' },
  { id: 'entrepreneur', label: 'Entrepreneur', icon: 'trending-up', color: '#E85B81', description: 'Running own business' },
  { id: 'creative', label: 'Creative', icon: 'color-palette', color: '#9B59B6', description: 'Artist or designer' },
  { id: 'healthcare', label: 'Healthcare', icon: 'medical', color: '#27AE60', description: 'Medical professional' },
  { id: 'other', label: 'Other', icon: 'person', color: '#7D5BA6', description: 'Other occupation' },
];

// Prompts questions
const PROMPT_QUESTIONS = [
  "The one thing I want to know about you is...",
  "My most controversial opinion is...",
  "My perfect travel day looks like...",
  "Two truths and a lie...",
  "My biggest adventure was...",
  "My life goal is to...",
  "My perfect date would be...",
  "I get way too excited about..."
];

export default function ProfileEditScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  
  // Form values
  const [username, setUsername] = useState("");
  const [age, setAge] = useState<number>(25);
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState<string | null>(null);
  const [occupation, setOccupation] = useState<string | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [location, setLocation] = useState("");
  const [prompts, setPrompts] = useState<Array<{question: string; answer: string}>>([]);
  const [activePrompt, setActivePrompt] = useState<number | null>(null);
  const [promptQuestion, setPromptQuestion] = useState("");
  const [promptAnswer, setPromptAnswer] = useState("");
  const headerHeight = useHeaderHeight();
  const [activeTab, setActiveTab] = useState(0);
  const [showSkeleton, setShowSkeleton] = useState(true);

  useEffect(() => {
    fetchUserProfile();
    // Hide skeleton after 1.5s for smooth loading experience
    const timer = setTimeout(() => setShowSkeleton(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Fetch user profile data
  const fetchUserProfile = async () => {
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
        const userData = response.data.user;
        setProfile(userData);
        
        // Set initial values
        setUsername(userData.username || '');
        setAge(userData.age || 25);
        setBio(userData.bio || '');
        setGender(userData.gender || null);
        setOccupation(userData.occupation || null);
        setLocation(userData.location || '');
        
        // Parse interests from string or array
        if (userData.interest) {
          try {
            if (Array.isArray(userData.interest)) {
              setInterests(userData.interest);
            } else if (typeof userData.interest === 'string') {
              // Handle the specific format from the API: "{Cooking,\"Street Food\",Backpacking}"
              // Remove braces and parse the comma-separated values
              const interestString = userData.interest.replace(/^{|}$/g, '');
              
              // Split by commas, but handle quoted values
              const parsedInterests = [];
              let currentItem = '';
              let inQuotes = false;
              
              for (let i = 0; i < interestString.length; i++) {
                const char = interestString[i];
                
                if (char === '"' && (i === 0 || interestString[i-1] !== '\\')) {
                  inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                  parsedInterests.push(currentItem.trim());
                  currentItem = '';
                } else {
                  currentItem += char;
                }
              }
              
              // Add the last item
              if (currentItem.trim()) {
                parsedInterests.push(currentItem.trim());
              }
              
              // Process quotes and backslashes
              const cleanedInterests = parsedInterests.map(item => {
                return item.replace(/\\"/g, '"').replace(/^"|"$/g, '');
              });
              
              setInterests(cleanedInterests);
            }
          } catch (err) {
            console.error('Error parsing interests:', err);
            setInterests([]);
          }
        } else {
          setInterests([]);
        }

        // Set prompts data
        if (userData.prompts && userData.prompts.prompts) {
          setPrompts(userData.prompts.prompts);
        } else {
          setPrompts([]);
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

  // Generic update function for all fields
  const updateField = async (endpoint: string, data: any) => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token found');
      }

      const response = await axios.patch(`${API_URL}/update/${endpoint}`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        Toast.show({
          type: 'success',
          text1: 'Success',
          text2: `Your ${endpoint} has been updated`
        });
        return true;
      } else {
        throw new Error(`Failed to update ${endpoint}`);
      }
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: err.message || `Failed to update ${endpoint}`
      });
      console.error(`Error updating ${endpoint}:`, err);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Update handlers for each field
  const handleUpdateUsername = async () => {
    if (username.trim().length < 3) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Username',
        text2: 'Username must be at least 3 characters'
      });
      return;
    }
    
    const success = await updateField('username', { username });
    if (success) {
      setActiveSection(null);
      fetchUserProfile();
    }
  };

  const handleUpdateAge = async () => {
    if (age < 18 || age > 100) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Age',
        text2: 'Age must be between 18 and 100'
      });
      return;
    }
    
    const success = await updateField('age', { age });
    if (success) {
      setActiveSection(null);
      fetchUserProfile();
    }
  };

  const handleUpdateBio = async () => {
    if (bio.trim().length < 10) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Bio',
        text2: 'Bio must be at least 10 characters'
      });
      return;
    }
    
    const success = await updateField('bio', { bio });
    if (success) {
      setActiveSection(null);
      fetchUserProfile();
    }
  };

  const handleUpdateGender = async () => {
    if (!gender) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Gender',
        text2: 'Please select a gender'
      });
      return;
    }
    
    const success = await updateField('gender', { gender });
    if (success) {
      setActiveSection(null);
      fetchUserProfile();
    }
  };

  const handleUpdateOccupation = async () => {
    if (!occupation) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Occupation',
        text2: 'Please select an occupation'
      });
      return;
    }
    
    const success = await updateField('occupation', { occupation });
    if (success) {
      setActiveSection(null);
      fetchUserProfile();
    }
  };

  const handleUpdateLocation = async () => {
    if (location.trim().length < 2) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Location',
        text2: 'Please enter a valid location'
      });
      return;
    }
    
    const success = await updateField('location', { location });
    if (success) {
      setActiveSection(null);
      fetchUserProfile();
    }
  };

  const handleUpdateInterests = async () => {
    if (interests.length < 3 || interests.length > 8) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Interests',
        text2: 'Please select between 3 and 8 interests'
      });
      return;
    }
    
    // Simply join the interests with commas without adding the curly braces
    const interestsString = interests.join(', ');
    
    // Send the interests as a simple string
    const success = await updateField('interests', { interests: interestsString });
    if (success) {
      setActiveSection(null);
      fetchUserProfile();
    }
  };

  const handleUpdatePrompts = async () => {
    if (prompts.length < 1) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Prompts',
        text2: 'Please add at least one prompt'
      });
      return;
    }

    // Format prompts for the API
    const promptsData = {
      prompts: prompts
    };
    
    const success = await updateField('prompts', { prompts: promptsData });
    if (success) {
      setActiveSection(null);
      fetchUserProfile();
    }
  };

  const addPrompt = () => {
    if (!promptQuestion || !promptAnswer.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Prompt',
        text2: 'Please provide both a question and answer'
      });
      return;
    }

    if (activePrompt !== null) {
      // Edit existing prompt
      const updatedPrompts = [...prompts];
      updatedPrompts[activePrompt] = { question: promptQuestion, answer: promptAnswer };
      setPrompts(updatedPrompts);
    } else {
      // Add new prompt
      setPrompts([...prompts, { question: promptQuestion, answer: promptAnswer }]);
    }

    // Reset fields
    setPromptQuestion("");
    setPromptAnswer("");
    setActivePrompt(null);
  };

  const editPrompt = (index: number) => {
    const prompt = prompts[index];
    setPromptQuestion(prompt.question);
    setPromptAnswer(prompt.answer);
    setActivePrompt(index);
  };

  const deletePrompt = (index: number) => {
    setPrompts(prompts.filter((_, i) => i !== index));
    if (activePrompt === index) {
      setActivePrompt(null);
      setPromptQuestion("");
      setPromptAnswer("");
    }
  };

  const toggleInterest = (interest: string) => {
    setInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      } else {
        if (prev.length >= 8) {
          Toast.show({
            type: 'error',
            text1: 'Maximum 8 interests allowed',
            text2: 'Please remove some interests before adding more'
          });
          return prev;
        }
        return [...prev, interest];
      }
    });
  };

  // Loading state with skeleton
  if (loading && !showSkeleton) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#7C3AED', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-4 pt-12 pb-6"
        >
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text className="text-xl text-white font-youngSerif">Edit Profile</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>

        <ScrollView className="flex-1 px-4 pt-4">
          <MotiView 
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 1000 }}
            style={{ opacity: 0.7 }}
          >
            <Skeleton
              colorMode="light"
              radius="round"
              height={120}
              width={120}
              colors={['#E5E7EB', '#F3F4F6']}
            />
            {[...Array(3)].map((_, i) => (
              <Skeleton
                key={i}
                colorMode="light"
                width={width - 32}
                height={60}
                radius={16}
                colors={['#E5E7EB', '#F3F4F6']}
              />
            ))}
          </MotiView>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Error state with animation
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
        <StatusBar style="light" />
        <LinearGradient
          colors={['#7C3AED', '#06B6D4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-4 pt-12 pb-6"
        >
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text className="text-xl text-white font-youngSerif">Error</Text>
            <View style={{ width: 24 }} />
          </View>
        </LinearGradient>

        <MotiView 
          from={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' }}
          className="flex-1 items-center justify-center p-4"
        >
          <BlurView intensity={70} tint="light" className="p-8 rounded-3xl items-center">
            <Ionicons name="alert-circle" size={60} color="#EF4444" />
            <Text className="text-xl font-youngSerif text-neutral-darkest mt-4 text-center">{error}</Text>
            <TouchableOpacity 
              onPress={fetchUserProfile}
              className="mt-6 bg-primary px-8 py-3 rounded-2xl"
            >
              <Text className="text-white font-montserratMedium">Try Again</Text>
            </TouchableOpacity>
          </BlurView>
        </MotiView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
      <StatusBar style="light" />
      {/* Header */}
      <LinearGradient
        colors={['#7C3AED', '#06B6D4']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-4 pt-12 pb-20"
      >
        <View className="flex-row items-center justify-between mb-6">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text className="text-xl text-white font-youngSerif">Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Profile Image Section */}
        <MotiView 
          from={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' }}
          className="items-center"
        >
          <View className="relative">
            <LinearGradient
              colors={['#7C3AED', '#06B6D4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="w-32 h-32 rounded-full p-2"
            >
              {profile?.profile_photo ? (
                <Image
                  source={{ uri: profile.profile_photo }}
                  className="w-full h-full rounded-full border-4 border-white"
                  defaultSource={require('@/assets/images/avatar.png')}
                />
              ) : (
                <View className="w-full h-full rounded-full bg-white items-center justify-center">
                  <Ionicons name="person" size={50} color="#7C3AED" />
                </View>
              )}
            </LinearGradient>
            <TouchableOpacity className="absolute bottom-0 right-0 bg-secondary w-10 h-10 rounded-full items-center justify-center border-4 border-white">
              <Ionicons name="camera" size={16} color="white" />
            </TouchableOpacity>
          </View>
        </MotiView>
      </LinearGradient>

      {/* Tab Navigation */}
      <View className="flex-row px-4 -mt-12 mb-4">
        {['Basic Info', 'Details', 'Interests'].map((tab, index) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(index)}
            className={`flex-1 py-3 ${index === 1 ? 'mx-2' : ''}`}
          >
            <LinearGradient
              colors={activeTab === index ? ['#7C3AED', '#06B6D4'] : ['#F8F9FA', '#F8F9FA']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="px-4 py-3 rounded-2xl items-center"
            >
              <Text className={`font-montserratMedium ${activeTab === index ? 'text-white' : 'text-neutral-dark'}`}>
                {tab}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        className="flex-1 px-4"
        showsVerticalScrollIndicator={false}
      >
        <AnimatePresence>
          {activeTab === 0 && (
            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: 20 }}
              className="space-y-4"
            >
              {/* Username Section */}
              <View className="bg-white rounded-3xl p-6 shadow-card">
                <Text className="text-lg font-montserratBold text-neutral-darkest mb-2">Username</Text>
                <View className="flex-row items-center bg-neutral-light rounded-xl px-4 py-3">
                  <Ionicons name="person" size={20} color="#7C3AED" />
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter username"
                    className="flex-1 ml-3 font-montserrat text-neutral-darkest"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleUpdateUsername}
                  disabled={saving}
                  className="mt-4 bg-primary rounded-xl py-3 items-center"
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-montserratMedium">Update Username</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Age Section */}
              <View className="bg-white rounded-3xl p-6 shadow-card">
                <Text className="text-lg font-montserratBold text-neutral-darkest mb-4">Age</Text>
                <View className="items-center">
                  <LinearGradient
                    colors={['#7C3AED', '#06B6D4']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="w-32 h-32 rounded-full items-center justify-center"
                  >
                    <Text className="text-4xl font-montserratBold text-white">{age}</Text>
                  </LinearGradient>
                  <View className="flex-row items-center mt-6 space-x-6">
                    <TouchableOpacity
                      onPress={() => setAge(prev => Math.max(18, prev - 1))}
                      className="w-12 h-12 bg-neutral-light rounded-full items-center justify-center"
                    >
                      <Ionicons name="remove" size={24} color="#7C3AED" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setAge(prev => Math.min(100, prev + 1))}
                      className="w-12 h-12 bg-neutral-light rounded-full items-center justify-center"
                    >
                      <Ionicons name="add" size={24} color="#7C3AED" />
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={handleUpdateAge}
                  disabled={saving}
                  className="mt-6 bg-primary rounded-xl py-3 items-center"
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-montserratMedium">Update Age</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Bio Section */}
              <View className="bg-white rounded-3xl p-6 shadow-card mb-6">
                <Text className="text-lg font-montserratBold text-neutral-darkest mb-2">Bio</Text>
                <View className="bg-neutral-light rounded-xl p-4">
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us about yourself..."
                    multiline
                    numberOfLines={6}
                    className="font-montserrat text-neutral-darkest"
                    textAlignVertical="top"
                  />
                </View>
                <Text className="text-right text-neutral-dark mt-2 font-montserrat">
                  {bio.length}/300 characters
                </Text>
                <TouchableOpacity
                  onPress={handleUpdateBio}
                  disabled={saving}
                  className="mt-4 bg-primary rounded-xl py-3 items-center"
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-montserratMedium">Update Bio</Text>
                  )}
                </TouchableOpacity>
              </View>
            </MotiView>
          )}

          {activeTab === 1 && (
            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: 20 }}
              className="space-y-4"
            >
              {/* Gender Section */}
              <View className="bg-white rounded-3xl p-6 shadow-card">
                <Text className="text-lg font-montserratBold text-neutral-darkest mb-4">Gender</Text>
                <View className="flex-row flex-wrap justify-between">
                  {GENDERS.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setGender(item.id)}
                      className="w-[48%] mb-4"
                    >
                      <LinearGradient
                        colors={gender === item.id 
                          ? [item.color + '20', item.color + '40']
                          : ['#F8F9FA', '#F8F9FA']}
                        className="p-4 rounded-2xl items-center border border-neutral-medium"
                      >
                        <View className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                          gender === item.id ? `bg-[${item.color}]` : 'bg-neutral-light'
                        }`}>
                          <Ionicons 
                            name={item.icon as any} 
                            size={24} 
                            color={gender === item.id ? '#fff' : item.color} 
                          />
                        </View>
                        <Text className={`font-montserratMedium ${
                          gender === item.id ? `text-[${item.color}]` : 'text-neutral-dark'
                        }`}>
                          {item.label}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={handleUpdateGender}
                  disabled={saving}
                  className="mt-4 bg-primary rounded-xl py-3 items-center"
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-montserratMedium">Update Gender</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Occupation Section */}
              <View className="bg-white rounded-3xl p-6 shadow-card">
                <Text className="text-lg font-montserratBold text-neutral-darkest mb-4">Occupation</Text>
                <View className="flex-row flex-wrap justify-between">
                  {OCCUPATIONS.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setOccupation(item.id)}
                      className="w-[48%] mb-4"
                    >
                      <LinearGradient
                        colors={occupation === item.id 
                          ? [item.color + '20', item.color + '40']
                          : ['#F8F9FA', '#F8F9FA']}
                        className="p-4 rounded-2xl items-center border border-neutral-medium"
                      >
                        <View className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                          occupation === item.id ? `bg-[${item.color}]` : 'bg-neutral-light'
                        }`}>
                          <Ionicons 
                            name={item.icon as any} 
                            size={24} 
                            color={occupation === item.id ? '#fff' : item.color} 
                          />
                        </View>
                        <Text className={`font-montserratMedium ${
                          occupation === item.id ? `text-[${item.color}]` : 'text-neutral-dark'
                        }`}>
                          {item.label}
                        </Text>
                        <Text className="text-xs text-neutral-dark text-center mt-1">
                          {item.description}
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  onPress={handleUpdateOccupation}
                  disabled={saving}
                  className="mt-4 bg-primary rounded-xl py-3 items-center"
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-montserratMedium">Update Occupation</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Location Section */}
              <View className="bg-white rounded-3xl p-6 shadow-card mb-6">
                <Text className="text-lg font-montserratBold text-neutral-darkest mb-2">Location</Text>
                <View className="flex-row items-center bg-neutral-light rounded-xl px-4 py-3">
                  <Ionicons name="location" size={20} color="#7C3AED" />
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Enter your location"
                    className="flex-1 ml-3 font-montserrat text-neutral-darkest"
                  />
                </View>
                <TouchableOpacity
                  onPress={handleUpdateLocation}
                  disabled={saving}
                  className="mt-4 bg-primary rounded-xl py-3 items-center"
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-montserratMedium">Update Location</Text>
                  )}
                </TouchableOpacity>
              </View>
            </MotiView>
          )}

          {activeTab === 2 && (
            <MotiView
              from={{ opacity: 0, translateX: -20 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: 20 }}
              className="space-y-4"
            >
              {/* Interests Section */}
              <View className="bg-white rounded-3xl p-6 shadow-card">
                <Text className="text-lg font-montserratBold text-neutral-darkest mb-2">Interests</Text>
                <Text className="text-neutral-dark mb-4">Select 3-8 interests that define you</Text>
                
                {/* Progress Bar */}
                <View className="mb-6">
                  <View className="h-2 bg-neutral-light rounded-full overflow-hidden">
                    <MotiView
                      animate={{
                        width: `${Math.min(100, (interests.length / 8) * 100)}%`,
                        backgroundColor: interests.length >= 3 ? '#06B6D4' : '#7C3AED'
                      }}
                      transition={{ type: 'spring' }}
                      className="h-full rounded-full"
                    />
                  </View>
                  <View className="flex-row justify-between mt-2">
                    <Text className="text-neutral-dark font-montserrat">
                      {interests.length}/8 selected
                    </Text>
                    {interests.length < 3 && (
                      <Text className="text-error font-montserrat">
                        Select at least 3
                      </Text>
                    )}
                  </View>
                </View>

                {/* Interest Categories */}
                {INTEREST_CATEGORIES.map((category, categoryIndex) => (
                  <MotiView
                    key={category.id}
                    from={{ opacity: 0, translateY: 20 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ delay: categoryIndex * 100 }}
                    className="mb-6 last:mb-0"
                  >
                    <View className="flex-row items-center mb-3">
                      <Ionicons name={category.icon as any} size={20} color="#7C3AED" />
                      <Text className="text-neutral-darkest font-montserratMedium ml-2">
                        {category.name}
                      </Text>
                    </View>
                    <View className="flex-row flex-wrap">
                      {category.interests.map((interest, index) => (
                        <TouchableOpacity
                          key={interest}
                          onPress={() => toggleInterest(interest)}
                          className="mr-2 mb-2"
                        >
                          <LinearGradient
                            colors={interests.includes(interest)
                              ? ['#7C3AED', '#06B6D4']
                              : ['#F8F9FA', '#F8F9FA']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            className="px-4 py-2 rounded-xl border border-neutral-medium"
                          >
                            <Text className={interests.includes(interest)
                              ? 'text-white font-montserratMedium'
                              : 'text-neutral-dark font-montserrat'
                            }>
                              {interest}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </MotiView>
                ))}

                <TouchableOpacity
                  onPress={handleUpdateInterests}
                  disabled={saving || interests.length < 3}
                  className={`mt-6 rounded-xl py-3 items-center ${
                    interests.length >= 3 ? 'bg-primary' : 'bg-neutral-medium'
                  }`}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-montserratMedium">
                      Update Interests
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Prompts Section */}
              <View className="bg-white rounded-3xl p-6 shadow-card mb-6">
                <Text className="text-lg font-montserratBold text-neutral-darkest mb-4">Prompts</Text>
                
                {/* Add New Prompt */}
                <View className="bg-neutral-light rounded-2xl p-4 mb-6">
                  <TouchableOpacity 
                    className="flex-row items-center justify-between bg-white rounded-xl p-4 mb-4"
                    onPress={() => {
                      // Add dropdown logic here
                      if (activePrompt === null && promptQuestion === "") {
                        setPromptQuestion(PROMPT_QUESTIONS[0]);
                      }
                    }}
                  >
                    <Text className={promptQuestion ? 'text-neutral-darkest' : 'text-neutral-dark'}>
                      {promptQuestion || "Select a prompt..."}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color="#7C3AED" />
                  </TouchableOpacity>

                  <TextInput
                    value={promptAnswer}
                    onChangeText={setPromptAnswer}
                    placeholder="Your answer..."
                    multiline
                    numberOfLines={4}
                    className="bg-white rounded-xl p-4 font-montserrat text-neutral-darkest"
                    textAlignVertical="top"
                  />

                  <TouchableOpacity
                    onPress={addPrompt}
                    disabled={!promptQuestion || !promptAnswer.trim()}
                    className={`mt-4 rounded-xl py-3 items-center ${
                      promptQuestion && promptAnswer.trim() ? 'bg-primary' : 'bg-neutral-medium'
                    }`}
                  >
                    <Text className="text-white font-montserratMedium">
                      {activePrompt !== null ? 'Update Prompt' : 'Add Prompt'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Existing Prompts */}
                {prompts.map((prompt, index) => (
                  <MotiView
                    key={index}
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 100 }}
                    className="bg-neutral-light rounded-2xl p-4 mb-4 last:mb-0"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1 mr-4">
                        <Text className="text-primary font-montserratBold mb-2">
                          {prompt.question}
                        </Text>
                        <Text className="text-neutral-dark font-montserrat">
                          {prompt.answer}
                        </Text>
                      </View>
                      <View className="flex-row">
                        <TouchableOpacity
                          onPress={() => editPrompt(index)}
                          className="w-8 h-8 bg-white rounded-full items-center justify-center mr-2"
                        >
                          <Ionicons name="create" size={16} color="#7C3AED" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => deletePrompt(index)}
                          className="w-8 h-8 bg-white rounded-full items-center justify-center"
                        >
                          <Ionicons name="trash" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </MotiView>
                ))}

                <TouchableOpacity
                  onPress={handleUpdatePrompts}
                  disabled={saving || prompts.length < 1}
                  className={`mt-6 rounded-xl py-3 items-center ${
                    prompts.length >= 1 ? 'bg-primary' : 'bg-neutral-medium'
                  }`}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-montserratMedium">
                      Save All Prompts
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </MotiView>
          )}
        </AnimatePresence>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  loadingGradient: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    width: width * 0.8,
  },
  loadingText: {
    marginTop: 16,
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'Montserrat',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  errorBlur: {
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    width: width * 0.9,
  },
  errorTitle: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'YoungSerif-Regular',
    marginTop: 16,
  },
  errorText: {
    color: '#FFF',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
    fontFamily: 'Montserrat',
    opacity: 0.8,
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFF',
    fontFamily: 'Montserrat-Medium',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'YoungSerif-Regular',
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  profileImageContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  profileImageGradient: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  profileImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    borderColor: '#FFF',
  },
  defaultProfileImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: 'rgba(125, 91, 166, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFF',
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 85,
    right: width / 2 - 60,
    backgroundColor: '#7D5BA6',
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
  usernameText: {
    fontSize: 22,
    fontFamily: 'YoungSerif-Regular',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(125, 91, 166, 0.08)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  statValue: {
    fontSize: 18,
    fontFamily: 'Montserrat-Bold',
    color: '#7D5BA6',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Montserrat',
    color: '#666',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(125, 91, 166, 0.2)',
  },
  editSectionsContainer: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#7D5BA6',
    marginBottom: 12,
    marginLeft: 8,
  },
  editSectionGroup: {
    marginBottom: 24,
  },
  editButton: {
    marginBottom: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  editButtonGradient: {
    borderRadius: 16,
  },
  editButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  editButtonTextContainer: {
    flex: 1,
  },
  editButtonLabel: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
  },
  editButtonValue: {
    fontSize: 13,
    fontFamily: 'Montserrat',
    color: '#666',
    marginTop: 2,
  },
  editFormContainer: {
    flex: 1,
    padding: 16,
  },
  
  // Form section styles
  formSection: {
    padding: 8,
  },
  formTitle: {
    fontSize: 24,
    fontFamily: 'YoungSerif-Regular',
    color: '#333',
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 14,
    fontFamily: 'Montserrat',
    color: '#666',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(125, 91, 166, 0.2)',
    marginBottom: 24,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    height: 50,
    fontFamily: 'Montserrat',
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#7D5BA6',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  saveButtonText: {
    color: '#fff',
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
  },
  
  // Age selector styles
  ageSelector: {
    alignItems: 'center',
    marginVertical: 24,
  },
  ageCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  ageValue: {
    fontSize: 64,
    fontFamily: 'Montserrat-Bold',
    color: '#fff',
  },
  ageControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  ageButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(125, 91, 166, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
  },
  
  // Bio edit styles
  textAreaContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(125, 91, 166, 0.2)',
    padding: 12,
    minHeight: 150,
  },
  textArea: {
    fontFamily: 'Montserrat',
    fontSize: 14,
    color: '#333',
    height: 150,
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Montserrat',
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
  },
  
  // Gender/Occupation selection styles
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  optionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  optionIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    marginVertical: 4,
  },
  optionDescription: {
    fontSize: 12,
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  
  // Interests styles
  progressContainer: {
    marginBottom: 24,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressCount: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#7D5BA6',
  },
  progressMinimum: {
    fontSize: 12,
    fontFamily: 'Montserrat',
    color: '#E85B81',
  },
  interestCategory: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
    marginLeft: 8,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(125, 91, 166, 0.2)',
  },
  interestTagSelected: {
    backgroundColor: '#7D5BA6',
    borderColor: '#7D5BA6',
  },
  interestTagText: {
    fontSize: 13,
    fontFamily: 'Montserrat',
    color: '#666',
  },
  interestTagTextSelected: {
    color: '#fff',
    fontFamily: 'Montserrat-Medium',
  },
  
  // Prompts styles
  promptFormCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(125, 91, 166, 0.1)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  promptFormLabel: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
    marginBottom: 16,
  },
  selectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(125, 91, 166, 0.05)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  selectText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Montserrat',
    color: '#333',
  },
  addButton: {
    backgroundColor: 'rgba(125, 91, 166, 0.1)',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  addButtonText: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#7D5BA6',
  },
  promptsList: {
    marginBottom: 24,
  },
  promptsListTitle: {
    fontSize: 16,
    fontFamily: 'Montserrat-Medium',
    color: '#333',
    marginBottom: 12,
  },
  promptCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(125, 91, 166, 0.1)',
  },
  promptCardContent: {
    flex: 1,
  },
  promptQuestion: {
    fontSize: 14,
    fontFamily: 'Montserrat-Medium',
    color: '#7D5BA6',
    marginBottom: 4,
  },
  promptAnswer: {
    fontSize: 14,
    fontFamily: 'Montserrat',
    color: '#666',
  },
  promptActions: {
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  promptActionButton: {
    padding: 8,
  },
});