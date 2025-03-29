import { View, Text, TouchableOpacity, TextInput, ScrollView, ActivityIndicator, Alert } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, SlideInRight, FadeIn } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from "@/src/context/AuthContext";

interface InfoField {
  id: string;
  label: string;
  value: string;
  editable: boolean;
  icon: string;
  placeholder: string;
  endpoint?: string;
  type: 'text' | 'selection';
  options?: Array<{
    id: string;
    label: string;
    icon: string;
    description: string;
  }>;
}

export default function EditInfoScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());
  
  const OCCUPATIONS = [
    { id: 'student', label: 'Student', icon: 'school', description: 'Currently studying' },
    { id: 'professional', label: 'Professional', icon: 'briefcase', description: 'Working in a company' },
    { id: 'entrepreneur', label: 'Entrepreneur', icon: 'trending-up', description: 'Running own business' },
    { id: 'creative', label: 'Creative', icon: 'color-palette', description: 'Artist or designer' },
    { id: 'healthcare', label: 'Healthcare', icon: 'medical', description: 'Medical professional' },
    { id: 'other', label: 'Other', icon: 'person', description: 'Other occupation' },
  ];
  
  const [fields, setFields] = useState<InfoField[]>([
    {
      id: 'username',
      label: 'Username',
      value: '',
      editable: true,
      icon: 'person-outline',
      placeholder: 'Enter your username',
      endpoint: '/api/update/name',
      type: 'text'
    },
    {
      id: 'age',
      label: 'Age',
      value: '',
      editable: false,
      icon: 'calendar-outline',
      placeholder: 'Your age',
      type: 'text'
    },
    {
      id: 'gender',
      label: 'Gender',
      value: '',
      editable: false,
      icon: 'male-female-outline',
      placeholder: 'Your gender',
      type: 'text'
    },
    {
      id: 'occupation',
      label: 'Occupation',
      value: '',
      editable: true,
      icon: 'briefcase-outline',
      placeholder: 'What do you do?',
      endpoint: '/api/update/occupation',
      type: 'selection',
      options: OCCUPATIONS
    },
    {
      id: 'location',
      label: 'Location',
      value: '',
      editable: true,
      icon: 'location-outline',
      placeholder: 'Where are you based?',
      endpoint: '/api/update/location',
      type: 'text'
    },
    {
      id: 'bio',
      label: 'Bio',
      value: '',
      editable: true,
      icon: 'create-outline',
      placeholder: 'Tell us about yourself',
      endpoint: '/api/update/bio',
      type: 'text'
    },
  ]);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserProfile = async () => {
      setIsLoading(true);
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const response = await fetch('http://10.0.2.2:5000/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          if (data.status === "success" && data.user) {
            // Map API fields to our form fields
            const userData = data.user;
            
            setFields(prev => prev.map(field => {
              let value = '';
              
              // Map field IDs to API response properties
              switch (field.id) {
                case 'username':
                  value = userData.username || '';
                  break;
                case 'age':
                  value = userData.age ? String(userData.age) : '';
                  break;
                case 'gender':
                  value = userData.gender || '';
                  break;
                case 'occupation':
                  value = userData.occupation || '';
                  break;
                case 'location':
                  value = userData.location || '';
                  break;
                case 'bio':
                  value = userData.bio || '';
                  break;
                default:
                  value = userData[field.id] || '';
              }
              
              return {
                ...field,
                value: value
              };
            }));
          } else {
            Alert.alert('Error', 'Invalid profile data format');
          }
        } else {
          Alert.alert('Error', 'Failed to load profile data');
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        Alert.alert('Error', 'Failed to connect to server');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleFieldChange = (id: string, newValue: string) => {
    setFields(prev => prev.map(field => 
      field.id === id ? { ...field, value: newValue } : field
    ));
    setChangedFields(prev => new Set(prev).add(id));
  };

  const handleSave = async () => {
    if (changedFields.size === 0) {
      Alert.alert('No Changes', 'No fields were changed');
      return;
    }
    
    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const editableFields = fields
        .filter(field => field.editable && field.endpoint && changedFields.has(field.id));
      
      const updatePromises = editableFields.map(async field => {
        try {
          // Create the appropriate payload based on field ID
          let payload = {};
          switch (field.id) {
            case 'username':
              payload = { username: field.value };
              break;
            default:
              payload = { [field.id]: field.value };
          }
          
          const response = await fetch(`http://10.0.2.2:5000${field.endpoint}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
          });
          
          const result = await response.json();
          return { 
            field: field.id, 
            success: response.ok && result.status === "success", 
            message: result.message 
          };
        } catch (error) {
          console.error(`Error updating ${field.id}:`, error);
          return { 
            field: field.id, 
            success: false, 
            message: 'Request failed' 
          };
        }
      });
      
      const results = await Promise.all(updatePromises);
      const failures = results.filter(result => !result.success);
      
      if (failures.length > 0) {
        Alert.alert(
          'Update Incomplete', 
          `Some fields couldn't be updated: ${failures.map(f => f.field).join(', ')}`
        );
      } else {
        Alert.alert('Success', 'Profile updated successfully');
        setChangedFields(new Set());
        router.back();
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-[#F8FAFF] justify-center items-center">
        <ActivityIndicator size="large" color="#1a237e" />
        <Text className="mt-4 text-[#1a237e]">Loading profile...</Text>
      </View>
    );
  }

  const renderField = (field: InfoField, index: number) => {
    if (field.type === 'text') {
      return (
        <Animated.View
          key={field.id}
          entering={SlideInRight.delay(index * 100)}
          className="mb-6"
        >
          <View className="flex-row items-center mb-2">
            <Ionicons name={field.icon as any} size={20} color="#1a237e" />
            <Text className="text-[#1a237e] font-medium ml-2">{field.label}</Text>
            {!field.editable && (
              <View className="ml-2 bg-indigo-50 rounded-full px-3 py-1">
                <Text className="text-xs text-[#1a237e]">Locked</Text>
              </View>
            )}
          </View>
          <View className="relative">
            <TextInput
              value={field.value}
              onChangeText={(text) => handleFieldChange(field.id, text)}
              placeholder={field.placeholder}
              editable={field.editable}
              className={`bg-white rounded-xl px-4 py-3.5 text-slate-800 ${
                field.editable 
                  ? 'border-2 border-indigo-100 focus:border-[#1a237e]' 
                  : 'bg-slate-50'
              }`}
              multiline={field.id === 'bio'}
              numberOfLines={field.id === 'bio' ? 4 : 1}
            />
            {!field.editable && (
              <View className="absolute right-3 top-3.5">
                <Ionicons name="lock-closed" size={16} color="#1a237e" />
              </View>
            )}
          </View>
        </Animated.View>
      );
    } else if (field.type === 'selection' && field.options) {
      return (
        <Animated.View
          key={field.id}
          entering={SlideInRight.delay(index * 100)}
          className="mb-6"
        >
          <View className="flex-row items-center mb-2">
            <Ionicons name={field.icon as any} size={20} color="#1a237e" />
            <Text className="text-[#1a237e] font-medium ml-2">{field.label}</Text>
          </View>
          
          <View className="flex-row flex-wrap justify-between mt-2">
            {field.options.map((option, optionIndex) => (
              <Animated.View
                key={option.id}
                entering={FadeIn.delay(optionIndex * 100)}
                className="w-[48%] mb-4"
              >
                <TouchableOpacity
                  onPress={() => handleFieldChange(field.id, option.id)}
                  className={`p-3 rounded-2xl items-center justify-center shadow-sm ${
                    field.value === option.id 
                      ? 'bg-indigo-600' 
                      : 'bg-white border border-indigo-100'
                  }`}
                  style={{
                    elevation: field.value === option.id ? 4 : 1,
                  }}
                  disabled={!field.editable || isSaving}
                >
                  <View className={`p-3 rounded-xl ${
                    field.value === option.id 
                      ? 'bg-indigo-500' 
                      : 'bg-indigo-50'
                  }`}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={24} 
                      color={field.value === option.id ? '#fff' : '#6366f1'} 
                    />
                  </View>
                  <Text className={`mt-2 font-medium ${
                    field.value === option.id 
                      ? "text-white" 
                      : "text-slate-700"
                  }`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>
      );
    }
    return null;
  };

  return (
    <View className="flex-1 bg-[#F8FAFF]">
      <Animated.View 
        entering={FadeInDown.duration(500)}
        className="bg-white px-6 pt-6 pb-4 border-b border-slate-100"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#1a237e" />
            <Text className="ml-2 text-[#1a237e]">Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-[#1a237e]">Basic Info</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isSaving || changedFields.size === 0}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#1a237e" />
            ) : (
              <Text className={`font-semibold ${changedFields.size > 0 ? 'text-[#1a237e]' : 'text-gray-400'}`}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-2xl font-bold text-[#1a237e] mb-2">
          Personal Information
        </Text>
        <Text className="text-slate-500 mb-6 text-base">
          Some fields cannot be changed after verification
        </Text>

        {fields.map((field, index) => renderField(field, index))}

        <View className="mt-4 bg-indigo-50 p-5 rounded-xl mb-6">
          <View className="flex-row items-center">
            <Ionicons name="shield-checkmark" size={24} color="#1a237e" />
            <Text className="text-[#1a237e] font-semibold ml-2">
              Verification Note
            </Text>
          </View>
          <Text className="text-slate-600 mt-2 leading-5">
            Age and gender cannot be changed after verification to maintain trust in our community. Contact support if you need to update these fields.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
} 