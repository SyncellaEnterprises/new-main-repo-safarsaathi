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

  useEffect(() => {
    fetchUserProfile();
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <LinearGradient
          colors={['#7D5BA6', '#50A6A7']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.loadingGradient}
        >
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Loading your profile...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <BlurView intensity={20} tint="dark" style={styles.errorBlur}>
          <Ionicons name="alert-circle" size={60} color="#E85B81" />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            onPress={fetchUserProfile}
            style={styles.retryButton}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </BlurView>
      </View>
    );
  }

  // Main profile edit view
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#7D5BA6', '#50A6A7']}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
        style={styles.header}
      >
        <TouchableOpacity 
          onPress={() => {
            if (activeSection) {
              setActiveSection(null);
            } else {
              router.back();
            }
          }}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeSection ? `Edit ${activeSection}` : 'Edit Profile'}
        </Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      {!activeSection ? (
        <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Profile Picture Section */}
          <View style={styles.profileImageContainer}>
            <LinearGradient
              colors={['#7D5BA6', '#50A6A7']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.profileImageGradient}
            >
              {profile?.profile_photo ? (
                <Image
                  source={{ uri: profile.profile_photo }}
                  style={styles.profileImage}
                  defaultSource={require('@/assets/images/avatar.png')}
                />
              ) : (
                <View style={styles.defaultProfileImage}>
                  <Ionicons name="person" size={60} color="#FFF" />
                </View>
              )}
            </LinearGradient>
            <TouchableOpacity style={styles.editPhotoButton}>
              <MaterialCommunityIcons name="camera-plus" size={20} color="#FFF" />
            </TouchableOpacity>
            
            <Text style={styles.usernameText}>{profile?.username}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile?.age || '--'}</Text>
                <Text style={styles.statLabel}>Age</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{interests.length}</Text>
                <Text style={styles.statLabel}>Interests</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{prompts.length}</Text>
                <Text style={styles.statLabel}>Prompts</Text>
              </View>
            </View>
          </View>

          {/* Edit Options List */}
          <View style={styles.editSectionsContainer}>
            <Text style={styles.sectionTitle}>Profile Details</Text>
            
            {/* Basic Info Section */}
            <View style={styles.editSectionGroup}>
              {/* Username */}
              <Animated.View 
                entering={FadeIn.delay(100).duration(500)}
                style={styles.editButton}
              >
                <LinearGradient
                  colors={['rgba(125, 91, 166, 0.15)', 'rgba(80, 166, 167, 0.15)']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.editButtonGradient}
                >
                  <TouchableOpacity
                    style={styles.editButtonContent}
                    onPress={() => setActiveSection('Username')}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: '#7D5BA6' }]}>
                      <FontAwesome5 name="user-alt" size={16} color="#FFF" />
                    </View>
                    <View style={styles.editButtonTextContainer}>
                      <Text style={styles.editButtonLabel}>Username</Text>
                      <Text style={styles.editButtonValue} numberOfLines={1}>
                        {profile?.username || 'Not set'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#7D5BA6" />
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
              
              {/* Age */}
              <Animated.View 
                entering={FadeIn.delay(200).duration(500)}
                style={styles.editButton}
              >
                <LinearGradient
                  colors={['rgba(125, 91, 166, 0.15)', 'rgba(80, 166, 167, 0.15)']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.editButtonGradient}
                >
                  <TouchableOpacity
                    style={styles.editButtonContent}
                    onPress={() => setActiveSection('Age')}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: '#4A90E2' }]}>
                      <FontAwesome5 name="birthday-cake" size={16} color="#FFF" />
                    </View>
                    <View style={styles.editButtonTextContainer}>
                      <Text style={styles.editButtonLabel}>Age</Text>
                      <Text style={styles.editButtonValue} numberOfLines={1}>
                        {profile?.age || 'Not set'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#7D5BA6" />
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
              
              {/* Bio */}
              <Animated.View 
                entering={FadeIn.delay(300).duration(500)}
                style={styles.editButton}
              >
                <LinearGradient
                  colors={['rgba(125, 91, 166, 0.15)', 'rgba(80, 166, 167, 0.15)']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.editButtonGradient}
                >
                  <TouchableOpacity
                    style={styles.editButtonContent}
                    onPress={() => setActiveSection('Bio')}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: '#27AE60' }]}>
                      <Ionicons name="text" size={16} color="#FFF" />
                    </View>
                    <View style={styles.editButtonTextContainer}>
                      <Text style={styles.editButtonLabel}>Bio</Text>
                      <Text style={styles.editButtonValue} numberOfLines={1}>
                        {profile?.bio ? (profile.bio.length > 30 ? profile.bio.substring(0, 30) + '...' : profile.bio) : 'Not set'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#7D5BA6" />
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            </View>
            
            <Text style={styles.sectionTitle}>Personal Details</Text>
            
            <View style={styles.editSectionGroup}>
              {/* Gender */}
              <Animated.View 
                entering={FadeIn.delay(400).duration(500)}
                style={styles.editButton}
              >
                <LinearGradient
                  colors={['rgba(125, 91, 166, 0.15)', 'rgba(80, 166, 167, 0.15)']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.editButtonGradient}
                >
                  <TouchableOpacity
                    style={styles.editButtonContent}
                    onPress={() => setActiveSection('Gender')}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: '#E85B81' }]}>
                      <Ionicons name="transgender" size={16} color="#FFF" />
                    </View>
                    <View style={styles.editButtonTextContainer}>
                      <Text style={styles.editButtonLabel}>Gender</Text>
                      <Text style={styles.editButtonValue} numberOfLines={1}>
                        {profile?.gender || 'Not set'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#7D5BA6" />
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
              
              {/* Occupation */}
              <Animated.View 
                entering={FadeIn.delay(500).duration(500)}
                style={styles.editButton}
              >
                <LinearGradient
                  colors={['rgba(125, 91, 166, 0.15)', 'rgba(80, 166, 167, 0.15)']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.editButtonGradient}
                >
                  <TouchableOpacity
                    style={styles.editButtonContent}
                    onPress={() => setActiveSection('Occupation')}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: '#9B59B6' }]}>
                      <Ionicons name="briefcase" size={16} color="#FFF" />
                    </View>
                    <View style={styles.editButtonTextContainer}>
                      <Text style={styles.editButtonLabel}>Occupation</Text>
                      <Text style={styles.editButtonValue} numberOfLines={1}>
                        {profile?.occupation || 'Not set'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#7D5BA6" />
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
              
              {/* Location */}
              <Animated.View 
                entering={FadeIn.delay(600).duration(500)}
                style={styles.editButton}
              >
                <LinearGradient
                  colors={['rgba(125, 91, 166, 0.15)', 'rgba(80, 166, 167, 0.15)']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.editButtonGradient}
                >
                  <TouchableOpacity
                    style={styles.editButtonContent}
                    onPress={() => setActiveSection('Location')}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: '#50A6A7' }]}>
                      <Ionicons name="location" size={16} color="#FFF" />
                    </View>
                    <View style={styles.editButtonTextContainer}>
                      <Text style={styles.editButtonLabel}>Location</Text>
                      <Text style={styles.editButtonValue} numberOfLines={1}>
                        {profile?.location || 'Not set'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#7D5BA6" />
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            </View>
            
            <Text style={styles.sectionTitle}>Matching Details</Text>
            
            <View style={styles.editSectionGroup}>
              {/* Interests */}
              <Animated.View 
                entering={FadeIn.delay(700).duration(500)}
                style={styles.editButton}
              >
                <LinearGradient
                  colors={['rgba(125, 91, 166, 0.15)', 'rgba(80, 166, 167, 0.15)']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.editButtonGradient}
                >
                  <TouchableOpacity
                    style={styles.editButtonContent}
                    onPress={() => setActiveSection('Interests')}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: '#F1C40F' }]}>
                      <Ionicons name="heart" size={16} color="#FFF" />
                    </View>
                    <View style={styles.editButtonTextContainer}>
                      <Text style={styles.editButtonLabel}>Interests</Text>
                      <Text style={styles.editButtonValue} numberOfLines={1}>
                        {interests.length > 0 
                          ? `${interests.slice(0, 2).join(', ')}${interests.length > 2 ? '...' : ''}`
                          : 'Not set'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#7D5BA6" />
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
              
              {/* Prompts */}
              <Animated.View 
                entering={FadeIn.delay(800).duration(500)}
                style={styles.editButton}
              >
                <LinearGradient
                  colors={['rgba(125, 91, 166, 0.15)', 'rgba(80, 166, 167, 0.15)']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.editButtonGradient}
                >
                  <TouchableOpacity
                    style={styles.editButtonContent}
                    onPress={() => setActiveSection('Prompts')}
                  >
                    <View style={[styles.iconContainer, { backgroundColor: '#E67E22' }]}>
                      <Ionicons name="chatbubble" size={16} color="#FFF" />
                    </View>
                    <View style={styles.editButtonTextContainer}>
                      <Text style={styles.editButtonLabel}>Prompts</Text>
                      <Text style={styles.editButtonValue} numberOfLines={1}>
                        {prompts.length > 0 ? `${prompts.length} prompt${prompts.length > 1 ? 's' : ''}` : 'Not set'}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#7D5BA6" />
                  </TouchableOpacity>
                </LinearGradient>
              </Animated.View>
            </View>
            
            <View style={{ height: 100 }} />
          </View>
        </ScrollView>
      ) : (
        <Animated.View 
          entering={SlideInRight.duration(300)}
          style={styles.editFormContainer}
        >
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {/* Username Edit */}
            {activeSection === 'Username' && (
              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Update Username</Text>
                <Text style={styles.formDescription}>
                  Choose a unique username that represents you
                </Text>
                
                <View style={styles.inputContainer}>
                  <Ionicons name="person" size={20} color="#7D5BA6" style={styles.inputIcon} />
                  <TextInput
                    value={username}
                    onChangeText={setUsername}
                    placeholder="Enter username"
                    style={styles.textInput}
                    autoCapitalize="none"
                  />
                </View>
                
                <TouchableOpacity
                  onPress={handleUpdateUsername}
                  disabled={saving}
                  style={styles.saveButton}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Username</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Age Edit */}
            {activeSection === 'Age' && (
              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Update Age</Text>
                <Text style={styles.formDescription}>
                  Select your current age
                </Text>
                
                <View style={styles.ageSelector}>
                  <LinearGradient
                    colors={['#7D5BA6', '#50A6A7']}
                    start={{x: 0, y: 0}}
                    end={{x: 1, y: 1}}
                    style={styles.ageCircle}
                  >
                    <Text style={styles.ageValue}>{age}</Text>
                  </LinearGradient>
                  
                  <View style={styles.ageControls}>
                    <TouchableOpacity
                      onPress={() => setAge(prev => Math.max(18, prev - 1))}
                      style={styles.ageButton}
                    >
                      <Ionicons name="remove" size={24} color="#7D5BA6" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={() => setAge(prev => Math.min(100, prev + 1))}
                      style={styles.ageButton}
                    >
                      <Ionicons name="add" size={24} color="#7D5BA6" />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <TouchableOpacity
                  onPress={handleUpdateAge}
                  disabled={saving}
                  style={styles.saveButton}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Age</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Bio Edit */}
            {activeSection === 'Bio' && (
              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Update Bio</Text>
                <Text style={styles.formDescription}>
                  Let people know about you
                </Text>
                
                <View style={styles.textAreaContainer}>
                  <TextInput
                    value={bio}
                    onChangeText={setBio}
                    placeholder="Tell us about yourself..."
                    multiline
                    numberOfLines={6}
                    style={styles.textArea}
                    textAlignVertical="top"
                  />
                </View>
                
                <Text style={styles.charCount}>
                  {bio.length}/300 characters
                </Text>
                
                <TouchableOpacity
                  onPress={handleUpdateBio}
                  disabled={saving}
                  style={styles.saveButton}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Bio</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Gender Edit */}
            {activeSection === 'Gender' && (
              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Update Gender</Text>
                <Text style={styles.formDescription}>
                  Select how you identify
                </Text>
                
                <View style={styles.optionsGrid}>
                  {GENDERS.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setGender(item.id)}
                      style={[
                        styles.optionCard,
                        gender === item.id && {
                          backgroundColor: item.color + '20', // Adding transparency
                          borderColor: item.color
                        }
                      ]}
                    >
                      <View style={[
                        styles.optionIconCircle,
                        { backgroundColor: gender === item.id ? item.color : '#F0F0F0' }
                      ]}>
                        <Ionicons 
                          name={item.icon as any} 
                          size={24} 
                          color={gender === item.id ? '#fff' : item.color} 
                        />
                      </View>
                      <Text style={[
                        styles.optionLabel,
                        { color: gender === item.id ? item.color : '#666' }
                      ]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <TouchableOpacity
                  onPress={handleUpdateGender}
                  disabled={saving}
                  style={styles.saveButton}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Gender</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Occupation Edit */}
            {activeSection === 'Occupation' && (
              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Update Occupation</Text>
                <Text style={styles.formDescription}>
                  Select what you do
                </Text>
                
                <View style={styles.optionsGrid}>
                  {OCCUPATIONS.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setOccupation(item.id)}
                      style={[
                        styles.optionCard,
                        occupation === item.id && {
                          backgroundColor: item.color + '20', // Adding transparency
                          borderColor: item.color
                        }
                      ]}
                    >
                      <View style={[
                        styles.optionIconCircle,
                        { backgroundColor: occupation === item.id ? item.color : '#F0F0F0' }
                      ]}>
                        <Ionicons 
                          name={item.icon as any} 
                          size={24} 
                          color={occupation === item.id ? '#fff' : item.color} 
                        />
                      </View>
                      <Text style={[
                        styles.optionLabel,
                        { color: occupation === item.id ? item.color : '#666' }
                      ]}>
                        {item.label}
                      </Text>
                      <Text style={[
                        styles.optionDescription,
                        { color: occupation === item.id ? item.color + 'CC' : '#999' }
                      ]}>
                        {item.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                
                <TouchableOpacity
                  onPress={handleUpdateOccupation}
                  disabled={saving}
                  style={styles.saveButton}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Occupation</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Location Edit */}
            {activeSection === 'Location' && (
              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Update Location</Text>
                <Text style={styles.formDescription}>
                  Where are you located?
                </Text>
                
                <View style={styles.inputContainer}>
                  <Ionicons name="location" size={20} color="#7D5BA6" style={styles.inputIcon} />
                  <TextInput
                    value={location}
                    onChangeText={setLocation}
                    placeholder="Enter your location"
                    style={styles.textInput}
                  />
                </View>
                
                <TouchableOpacity
                  onPress={handleUpdateLocation}
                  disabled={saving}
                  style={styles.saveButton}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Location</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Interests Edit */}
            {activeSection === 'Interests' && (
              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Update Interests</Text>
                <Text style={styles.formDescription}>
                  Select 3-8 interests to help us find your perfect match
                </Text>
                
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { 
                          width: `${Math.min(100, (interests.length / 8) * 100)}%`,
                          backgroundColor: interests.length >= 3 ? '#50A6A7' : '#7D5BA6' 
                        }
                      ]}
                    />
                  </View>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressCount}>
                      {interests.length}/8 selected
                    </Text>
                    {interests.length < 3 && (
                      <Text style={styles.progressMinimum}>
                        Select at least 3
                      </Text>
                    )}
                  </View>
                </View>
                
                {INTEREST_CATEGORIES.map((category) => (
                  <View key={category.id} style={styles.interestCategory}>
                    <View style={styles.categoryHeader}>
                      <Ionicons name={category.icon as any} size={20} color="#7D5BA6" />
                      <Text style={styles.categoryTitle}>
                        {category.name}
                      </Text>
                    </View>
                    
                    <View style={styles.interestTags}>
                      {category.interests.map((interest) => (
                        <TouchableOpacity
                          key={interest}
                          onPress={() => toggleInterest(interest)}
                          style={[
                            styles.interestTag,
                            interests.includes(interest) && styles.interestTagSelected
                          ]}
                        >
                          <Text style={[
                            styles.interestTagText,
                            interests.includes(interest) && styles.interestTagTextSelected
                          ]}>
                            {interest}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                ))}
                
                <TouchableOpacity
                  onPress={handleUpdateInterests}
                  disabled={saving || interests.length < 3}
                  style={[
                    styles.saveButton,
                    interests.length < 3 && { opacity: 0.5 }
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Interests</Text>
                  )}
                </TouchableOpacity>
                
                <View style={{ height: 20 }} />
              </View>
            )}

            {/* Prompts Edit */}
            {activeSection === 'Prompts' && (
              <View style={styles.formSection}>
                <Text style={styles.formTitle}>Update Prompts</Text>
                <Text style={styles.formDescription}>
                  Add or edit your prompts to help others get to know you
                </Text>
                
                {/* Prompt form */}
                <View style={styles.promptFormCard}>
                  <Text style={styles.promptFormLabel}>Add a prompt:</Text>
                  
                  <View style={styles.selectContainer}>
                    <Ionicons name="help-circle" size={20} color="#7D5BA6" style={styles.inputIcon} />
                    <View style={{ flex: 1 }}>
                      <TouchableOpacity 
                        style={styles.selectTrigger}
                        onPress={() => {
                          // Add dropdown logic here
                          // For now, we'll just use the first prompt
                          if (activePrompt === null && promptQuestion === "") {
                            setPromptQuestion(PROMPT_QUESTIONS[0]);
                          }
                        }}
                      >
                        <Text style={[
                          styles.selectText,
                          !promptQuestion && { color: '#AAA' }
                        ]}>
                          {promptQuestion || "Select a prompt question..."}
                        </Text>
                        <Ionicons name="chevron-down" size={16} color="#7D5BA6" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  <View style={styles.textAreaContainer}>
                    <TextInput
                      value={promptAnswer}
                      onChangeText={setPromptAnswer}
                      placeholder="Your answer..."
                      multiline
                      numberOfLines={4}
                      style={styles.textArea}
                      textAlignVertical="top"
                    />
                  </View>
                  
                  <TouchableOpacity
                    onPress={addPrompt}
                    disabled={!promptQuestion || !promptAnswer.trim()}
                    style={[
                      styles.addButton,
                      (!promptQuestion || !promptAnswer.trim()) && { opacity: 0.5 }
                    ]}
                  >
                    <Text style={styles.addButtonText}>
                      {activePrompt !== null ? 'Update Prompt' : 'Add Prompt'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                {/* Existing prompts */}
                {prompts.length > 0 && (
                  <View style={styles.promptsList}>
                    <Text style={styles.promptsListTitle}>Your prompts:</Text>
                    
                    {prompts.map((prompt, index) => (
                      <View key={index} style={styles.promptCard}>
                        <View style={styles.promptCardContent}>
                          <Text style={styles.promptQuestion}>
                            {prompt.question}
                          </Text>
                          <Text style={styles.promptAnswer}>
                            {prompt.answer}
                          </Text>
                        </View>
                        <View style={styles.promptActions}>
                          <TouchableOpacity 
                            style={styles.promptActionButton}
                            onPress={() => editPrompt(index)}
                          >
                            <Ionicons name="create" size={18} color="#7D5BA6" />
                          </TouchableOpacity>
                          <TouchableOpacity 
                            style={styles.promptActionButton}
                            onPress={() => deletePrompt(index)}
                          >
                            <Ionicons name="trash" size={18} color="#E85B81" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
                
                <TouchableOpacity
                  onPress={handleUpdatePrompts}
                  disabled={saving || prompts.length < 1}
                  style={[
                    styles.saveButton,
                    prompts.length < 1 && { opacity: 0.5 }
                  ]}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Prompts</Text>
                  )}
                </TouchableOpacity>
                
                <View style={{ height: 20 }} />
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}
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