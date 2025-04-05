import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Image, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';
import Toast from 'react-native-toast-message';
import { INTEREST_CATEGORIES } from '@/src/constants/interests';

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
  { id: 'male', label: 'Male', icon: 'male' },
  { id: 'female', label: 'Female', icon: 'female' },
  { id: 'non-binary', label: 'Non-binary', icon: 'transgender' },
  { id: 'other', label: 'Other', icon: 'person' },
];

// Occupation options
const OCCUPATIONS = [
  { id: 'student', label: 'Student', icon: 'school', description: 'Currently studying' },
  { id: 'professional', label: 'Professional', icon: 'briefcase', description: 'Working in a company' },
  { id: 'entrepreneur', label: 'Entrepreneur', icon: 'trending-up', description: 'Running own business' },
  { id: 'creative', label: 'Creative', icon: 'color-palette', description: 'Artist or designer' },
  { id: 'healthcare', label: 'Healthcare', icon: 'medical', description: 'Medical professional' },
  { id: 'other', label: 'Other', icon: 'person', description: 'Other occupation' },
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
      <View className="flex-1 bg-neutral-light items-center justify-center">
        <ActivityIndicator size="large" color="#7D5BA6" />
        <Text className="mt-4 text-primary-dark font-montserrat">Loading profile...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 bg-neutral-light items-center justify-center p-4">
        <Text className="text-primary-dark text-center mb-4 font-montserrat">{error}</Text>
        <TouchableOpacity 
          onPress={fetchUserProfile}
          className="bg-primary px-6 py-3 rounded-xl"
        >
          <Text className="text-neutral-lightest font-montserratMedium">Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Main profile edit view
  return (
    <SafeAreaView className="flex-1 bg-neutral-light">
      <View className="bg-neutral-lightest px-6 py-4 flex-row justify-between items-center">
        <TouchableOpacity 
          onPress={() => {
            if (activeSection) {
              setActiveSection(null);
            } else {
              router.back();
            }
          }}
          className="flex-row items-center"
        >
          <Ionicons name="arrow-back" size={24} color="#7D5BA6" />
          <Text className="ml-2 text-primary font-montserratMedium">
            {activeSection ? 'Back' : 'Profile'}
          </Text>
        </TouchableOpacity>
        <Text className="text-lg font-youngSerif text-primary-dark">
          {activeSection ? `Edit ${activeSection}` : 'Edit Profile'}
        </Text>
        <View style={{ width: 32 }} />
      </View>

      {!activeSection ? (
        <ScrollView className="flex-1 p-6">
          {/* Profile picture section */}
          <View className="items-center mb-8">
            <View className="w-32 h-32 bg-neutral-medium rounded-full border-4 border-neutral-lightest shadow-md mb-4">
              {profile?.profile_photo ? (
                <Image
                  source={{ uri: profile.profile_photo }}
                  className="w-full h-full rounded-full"
                  defaultSource={require('@/assets/images/avatar.png')}
                />
              ) : (
                <View className="w-full h-full rounded-full bg-primary-light/30 items-center justify-center">
                  <Ionicons name="person" size={50} color="#7D5BA6" />
                </View>
              )}
              <TouchableOpacity
                className="absolute right-0 bottom-0 bg-primary rounded-full p-2"
                onPress={() => {/* Photo upload logic */}}
              >
                <Ionicons name="camera" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Edit options list */}
          <View className="space-y-4">
            {/* Username */}
            <TouchableOpacity
              className="bg-neutral-lightest p-4 rounded-xl shadow-sm flex-row justify-between items-center"
              onPress={() => setActiveSection('Username')}
            >
              <View className="flex-row items-center">
                <Ionicons name="person" size={24} color="#7D5BA6" />
                <View className="ml-4">
                  <Text className="text-lg font-youngSerif text-neutral-darkest">Username</Text>
                  <Text className="text-neutral-dark font-montserrat">{profile?.username}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#7D5BA6" />
            </TouchableOpacity>

            {/* Age */}
            <TouchableOpacity
              className="bg-neutral-lightest p-4 rounded-xl shadow-sm flex-row justify-between items-center"
              onPress={() => setActiveSection('Age')}
            >
              <View className="flex-row items-center">
                <Ionicons name="calendar" size={24} color="#7D5BA6" />
                <View className="ml-4">
                  <Text className="text-lg font-youngSerif text-neutral-darkest">Age</Text>
                  <Text className="text-neutral-dark font-montserrat">{profile?.age || 'Not set'}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#7D5BA6" />
            </TouchableOpacity>

            {/* Bio */}
            <TouchableOpacity
              className="bg-neutral-lightest p-4 rounded-xl shadow-sm flex-row justify-between items-center"
              onPress={() => setActiveSection('Bio')}
            >
              <View className="flex-row items-center">
                <Ionicons name="create" size={24} color="#7D5BA6" />
                <View className="ml-4 flex-1 mr-4">
                  <Text className="text-lg font-youngSerif text-neutral-darkest">Bio</Text>
                  <Text className="text-neutral-dark font-montserrat" numberOfLines={1}>
                    {profile?.bio || 'Not set'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#7D5BA6" />
            </TouchableOpacity>

            {/* Gender */}
            <TouchableOpacity
              className="bg-neutral-lightest p-4 rounded-xl shadow-sm flex-row justify-between items-center"
              onPress={() => setActiveSection('Gender')}
            >
              <View className="flex-row items-center">
                <Ionicons name="transgender" size={24} color="#7D5BA6" />
                <View className="ml-4">
                  <Text className="text-lg font-youngSerif text-neutral-darkest">Gender</Text>
                  <Text className="text-neutral-dark font-montserrat capitalize">
                    {profile?.gender || 'Not set'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#7D5BA6" />
            </TouchableOpacity>

            {/* Occupation */}
            <TouchableOpacity
              className="bg-neutral-lightest p-4 rounded-xl shadow-sm flex-row justify-between items-center"
              onPress={() => setActiveSection('Occupation')}
            >
              <View className="flex-row items-center">
                <Ionicons name="briefcase" size={24} color="#7D5BA6" />
                <View className="ml-4">
                  <Text className="text-lg font-youngSerif text-neutral-darkest">Occupation</Text>
                  <Text className="text-neutral-dark font-montserrat">
                    {profile?.occupation || 'Not set'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#7D5BA6" />
            </TouchableOpacity>

            {/* Location */}
            <TouchableOpacity
              className="bg-neutral-lightest p-4 rounded-xl shadow-sm flex-row justify-between items-center"
              onPress={() => setActiveSection('Location')}
            >
              <View className="flex-row items-center">
                <Ionicons name="location" size={24} color="#7D5BA6" />
                <View className="ml-4">
                  <Text className="text-lg font-youngSerif text-neutral-darkest">Location</Text>
                  <Text className="text-neutral-dark font-montserrat">
                    {profile?.location || 'Not set'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#7D5BA6" />
            </TouchableOpacity>

            {/* Interests */}
            <TouchableOpacity
              className="bg-neutral-lightest p-4 rounded-xl shadow-sm flex-row justify-between items-center"
              onPress={() => setActiveSection('Interests')}
            >
              <View className="flex-row items-center">
                <Ionicons name="heart" size={24} color="#7D5BA6" />
                <View className="ml-4">
                  <Text className="text-lg font-youngSerif text-neutral-darkest">Interests</Text>
                  <Text className="text-neutral-dark font-montserrat">
                    {Array.isArray(profile?.interest) 
                      ? profile.interest.slice(0, 2).join(', ') + (profile.interest.length > 2 ? '...' : '')
                      : typeof profile?.interest === 'string'
                        ? profile.interest.split(',').slice(0, 2).join(', ') + 
                          (profile.interest.split(',').length > 2 ? '...' : '')
                        : 'Not set'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#7D5BA6" />
            </TouchableOpacity>

            {/* Prompts */}
            <TouchableOpacity
              className="bg-neutral-lightest p-4 rounded-xl shadow-sm flex-row justify-between items-center"
              onPress={() => setActiveSection('Prompts')}
            >
              <View className="flex-row items-center">
                <Ionicons name="chatbubble" size={24} color="#7D5BA6" />
                <View className="ml-4">
                  <Text className="text-lg font-youngSerif text-neutral-darkest">Prompts</Text>
                  <Text className="text-neutral-dark font-montserrat">
                    {profile?.prompts?.prompts && profile.prompts.prompts.length > 0
                      ? `${profile.prompts.prompts.length} prompt${profile.prompts.prompts.length > 1 ? 's' : ''}`
                      : 'Not set'}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#7D5BA6" />
            </TouchableOpacity>
          </View>
          
          <View className="h-20" />
        </ScrollView>
      ) : (
        <ScrollView className="flex-1 p-6">
          {/* Username Edit */}
          {activeSection === 'Username' && (
            <View>
              <Text className="text-2xl font-youngSerif text-primary-dark mb-4">Update Username</Text>
              <Text className="text-neutral-dark mb-6 font-montserrat">
                Choose a unique username that represents you
              </Text>
              
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                className="bg-neutral-lightest p-4 rounded-xl border border-neutral-medium mb-4 font-montserrat"
                autoCapitalize="none"
              />
              
              <TouchableOpacity
                onPress={handleUpdateUsername}
                disabled={saving}
                className="bg-primary p-4 rounded-xl mt-6"
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-montserratMedium">Save Username</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Age Edit */}
          {activeSection === 'Age' && (
            <View>
              <Text className="text-2xl font-youngSerif text-primary-dark mb-4">Update Age</Text>
              <Text className="text-neutral-dark mb-6 font-montserrat">
                Select your current age
              </Text>
              
              <View className="items-center justify-center">
                <View className="w-40 h-40 bg-neutral-lightest rounded-full items-center justify-center shadow-md mb-8">
                  <Text className="text-5xl font-montserratBold text-primary">{age}</Text>
                </View>
                
                <View className="flex-row items-center justify-center space-x-8">
                  <TouchableOpacity
                    onPress={() => setAge(prev => Math.max(18, prev - 1))}
                    className="bg-primary/20 w-14 h-14 rounded-full items-center justify-center"
                  >
                    <Ionicons name="remove" size={24} color="#7D5BA6" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => setAge(prev => Math.min(100, prev + 1))}
                    className="bg-primary/20 w-14 h-14 rounded-full items-center justify-center"
                  >
                    <Ionicons name="add" size={24} color="#7D5BA6" />
                  </TouchableOpacity>
                </View>
              </View>
              
              <TouchableOpacity
                onPress={handleUpdateAge}
                disabled={saving}
                className="bg-primary p-4 rounded-xl mt-12"
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-montserratMedium">Save Age</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Bio Edit */}
          {activeSection === 'Bio' && (
            <View>
              <Text className="text-2xl font-youngSerif text-primary-dark mb-4">Update Bio</Text>
              <Text className="text-neutral-dark mb-6 font-montserrat">
                Let people know about you
              </Text>
              
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell us about yourself..."
                multiline
                numberOfLines={6}
                className="bg-neutral-lightest p-4 rounded-xl border border-neutral-medium mb-4 font-montserrat min-h-[120]"
                textAlignVertical="top"
              />
              
              <Text className="text-neutral-dark font-montserrat text-right">
                {bio.length}/300 characters
              </Text>
              
              <TouchableOpacity
                onPress={handleUpdateBio}
                disabled={saving}
                className="bg-primary p-4 rounded-xl mt-6"
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-montserratMedium">Save Bio</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Gender Edit */}
          {activeSection === 'Gender' && (
            <View>
              <Text className="text-2xl font-youngSerif text-primary-dark mb-4">Update Gender</Text>
              <Text className="text-neutral-dark mb-6 font-montserrat">
                Select how you identify
              </Text>
              
              <View className="flex-row flex-wrap justify-between">
                {GENDERS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setGender(item.id)}
                    className={`w-[48%] p-4 rounded-xl mb-4 items-center ${
                      gender === item.id 
                        ? 'bg-primary' 
                        : 'bg-neutral-lightest border border-neutral-medium'
                    }`}
                  >
                    <Ionicons 
                      name={item.icon as any} 
                      size={32} 
                      color={gender === item.id ? '#fff' : '#7D5BA6'} 
                    />
                    <Text className={`mt-2 font-montserratMedium ${
                      gender === item.id ? 'text-white' : 'text-neutral-dark'
                    }`}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                onPress={handleUpdateGender}
                disabled={saving}
                className="bg-primary p-4 rounded-xl mt-6"
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-montserratMedium">Save Gender</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Occupation Edit */}
          {activeSection === 'Occupation' && (
            <View>
              <Text className="text-2xl font-youngSerif text-primary-dark mb-4">Update Occupation</Text>
              <Text className="text-neutral-dark mb-6 font-montserrat">
                Select what you do
              </Text>
              
              <View className="flex-row flex-wrap justify-between">
                {OCCUPATIONS.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => setOccupation(item.id)}
                    className={`w-[48%] p-4 rounded-xl mb-4 items-center ${
                      occupation === item.id 
                        ? 'bg-primary' 
                        : 'bg-neutral-lightest border border-neutral-medium'
                    }`}
                  >
                    <Ionicons 
                      name={item.icon as any} 
                      size={32} 
                      color={occupation === item.id ? '#fff' : '#7D5BA6'} 
                    />
                    <Text className={`mt-2 font-montserratMedium ${
                      occupation === item.id ? 'text-white' : 'text-neutral-dark'
                    }`}>
                      {item.label}
                    </Text>
                    <Text className={`text-xs text-center ${
                      occupation === item.id ? 'text-white/80' : 'text-neutral-dark/70'
                    }`}>
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              <TouchableOpacity
                onPress={handleUpdateOccupation}
                disabled={saving}
                className="bg-primary p-4 rounded-xl mt-6"
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-montserratMedium">Save Occupation</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Location Edit */}
          {activeSection === 'Location' && (
            <View>
              <Text className="text-2xl font-youngSerif text-primary-dark mb-4">Update Location</Text>
              <Text className="text-neutral-dark mb-6 font-montserrat">
                Where are you located?
              </Text>
              
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Enter your location"
                className="bg-neutral-lightest p-4 rounded-xl border border-neutral-medium mb-4 font-montserrat"
              />
              
              <TouchableOpacity
                onPress={handleUpdateLocation}
                disabled={saving}
                className="bg-primary p-4 rounded-xl mt-6"
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-montserratMedium">Save Location</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Interests Edit */}
          {activeSection === 'Interests' && (
            <View>
              <Text className="text-2xl font-youngSerif text-primary-dark mb-4">Update Interests</Text>
              <Text className="text-neutral-dark mb-6 font-montserrat">
                Select 3-8 interests to help us find your perfect match
              </Text>
              
              <View className="mt-2 mb-6">
                <View className="h-[3px] bg-neutral-medium rounded-full">
                  <View 
                    className="h-full bg-primary rounded-full" 
                    style={{ 
                      width: `${Math.min(100, (interests.length / 8) * 100)}%`,
                      backgroundColor: interests.length >= 3 ? '#50A6A7' : '#7D5BA6' 
                    }}
                  />
                </View>
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-primary font-montserratMedium">
                    {interests.length}/8 selected
                  </Text>
                  {interests.length < 3 && (
                    <Text className="text-primary-light font-montserrat text-sm">
                      Select at least 3
                    </Text>
                  )}
                </View>
              </View>
              
              {INTEREST_CATEGORIES.map((category) => (
                <View key={category.id} className="mb-6">
                  <View className="flex-row items-center mb-3">
                    <Ionicons name={category.icon as any} size={20} color="#7D5BA6" />
                    <Text className="text-lg font-montserratMedium text-primary-dark ml-2">
                      {category.name}
                    </Text>
                  </View>
                  
                  <View className="flex-row flex-wrap gap-2">
                    {category.interests.map((interest) => (
                      <TouchableOpacity
                        key={interest}
                        onPress={() => toggleInterest(interest)}
                        className={`px-4 py-2 rounded-full border ${
                          interests.includes(interest)
                            ? 'bg-primary border-primary'
                            : 'bg-neutral-lightest border-neutral-medium'
                        }`}
                      >
                        <Text className={
                          interests.includes(interest)
                            ? 'text-white font-montserratMedium'
                            : 'text-neutral-dark font-montserrat'
                        }>
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
                className={`bg-primary p-4 rounded-xl mt-6 ${
                  interests.length >= 3 ? 'opacity-100' : 'opacity-50'
                }`}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-montserratMedium">Save Interests</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Prompts */}
          {activeSection === 'Prompts' && (
            <View>
              <Text className="text-2xl font-youngSerif text-primary-dark mb-4">Update Prompts</Text>
              <Text className="text-neutral-dark mb-6 font-montserrat">
                Add or edit your prompts
              </Text>
              
              {prompts.map((prompt, index) => (
                <View key={index} className="mb-4">
                  <Text className="text-lg font-youngSerif text-primary-dark mb-2">
                    {prompt.question}
                  </Text>
                  <TextInput
                    value={prompt.answer}
                    onChangeText={(text) => {
                      const updatedPrompts = [...prompts];
                      updatedPrompts[index] = { ...prompt, answer: text };
                      setPrompts(updatedPrompts);
                    }}
                    placeholder="Enter answer"
                    className="bg-neutral-lightest p-4 rounded-xl border border-neutral-medium"
                  />
                </View>
              ))}
              
              <TouchableOpacity
                onPress={handleUpdatePrompts}
                disabled={saving || prompts.length < 1}
                className={`bg-primary p-4 rounded-xl mt-6 ${
                  prompts.length >= 1 ? 'opacity-100' : 'opacity-50'
                }`}
              >
                {saving ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white text-center font-montserratMedium">Save Prompts</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}