import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Information fields definition
const INFO_FIELDS: InfoField[] = [
  {
    id: 'username',
    label: 'Username',
    value: '',
    editable: true,
    icon: 'person',
    placeholder: 'Add username',
    endpoint: 'username',
    type: 'text'
  },
  {
    id: 'email',
    label: 'Email',
    value: '',
    editable: false,
    icon: 'mail',
    placeholder: 'Add email',
    type: 'text'
  },
  {
    id: 'age',
    label: 'Age',
    value: '',
    editable: true,
    icon: 'calendar',
    placeholder: 'Add age',
    endpoint: 'age',
    type: 'selection',
    options: Array.from({ length: 63 }, (_, i) => ({
      id: String(i + 18),
      label: `${i + 18}`,
      icon: 'calendar',
      description: `${i + 18} years old`
    }))
  },
  {
    id: 'gender',
    label: 'Gender',
    value: '',
    editable: true,
    icon: 'transgender',
    placeholder: 'Add gender',
    endpoint: 'gender',
    type: 'selection',
    options: [
      { id: 'male', label: 'Male', icon: 'male', description: 'Identify as male' },
      { id: 'female', label: 'Female', icon: 'female', description: 'Identify as female' },
      { id: 'non-binary', label: 'Non-binary', icon: 'transgender', description: 'Identify as non-binary' },
      { id: 'other', label: 'Other', icon: 'person', description: 'Prefer to self-describe' }
    ]
  },
  {
    id: 'occupation',
    label: 'Occupation',
    value: '',
    editable: true,
    icon: 'briefcase',
    placeholder: 'Add occupation',
    endpoint: 'occupation',
    type: 'text'
  },
  {
    id: 'bio',
    label: 'Bio',
    value: '',
    editable: true,
    icon: 'create',
    placeholder: 'Add a short bio about yourself',
    endpoint: 'bio',
    type: 'text'
  }
];

export default function EditInfoScreen() {
  const router = useRouter();
  const [fields, setFields] = useState<InfoField[]>(INFO_FIELDS);
  const [activeField, setActiveField] = useState<InfoField | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSelectionModal, setShowSelectionModal] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    setIsLoading(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const response = await fetch('http://10.0.2.2:5000/api/users/me', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === "success" && data.user) {
          // Update our fields with the API data
          const updatedFields = fields.map(field => {
            // Map our field IDs to API response fields
            let value = '';
            switch (field.id) {
              case 'username':
                value = data.user.username || '';
                break;
              case 'email':
                value = data.user.email || '';
                break;
              case 'age':
                value = data.user.age ? String(data.user.age) : '';
                break;
              case 'gender':
                value = data.user.gender || '';
                break;
              case 'occupation':
                value = data.user.occupation || '';
                break;
              case 'bio':
                value = data.user.bio || '';
                break;
              default:
                value = '';
            }
            return { ...field, value };
          });
          setFields(updatedFields);
        }
      } else {
        Alert.alert('Error', 'Failed to load user profile');
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (id: string, newValue: string) => {
    setFields(prevFields => {
      const updated = prevFields.map(field => 
        field.id === id ? { ...field, value: newValue } : field
      );
      setHasChanges(true);
      return updated;
    });
    setShowSelectionModal(false);
  };

  const handleSave = async () => {
    if (!hasChanges) {
      Alert.alert('No Changes', 'No changes were made to your profile');
      return;
    }

    setIsSaving(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const changedFields = fields.filter(field => 
        field.editable && 
        field.value !== INFO_FIELDS.find(f => f.id === field.id)?.value &&
        field.endpoint
      );

      // Run all update requests in parallel
      const updatePromises = changedFields.map(field => {
        // Create a payload with the field as key and value as value
        // e.g. for 'username' field: { username: 'JohnDoe' }
        const payload = { [field.endpoint!]: field.value };
        
        return fetch(`http://10.0.2.2:5000/api/update/${field.endpoint}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
      });

      const responses = await Promise.all(updatePromises);
      
      // Check if all responses are successful
      const allSuccessful = responses.every(res => res.ok);
      
      if (allSuccessful) {
        Alert.alert('Success', 'Profile updated successfully');
        setHasChanges(false);
        router.back();
      } else {
        // Get first error response to show
        const firstErrorResponse = responses.find(res => !res.ok);
        const errorText = firstErrorResponse ? await firstErrorResponse.text() : 'Unknown error';
        Alert.alert('Error', `Failed to update profile: ${errorText}`);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditText = (field: InfoField) => {
    setActiveField(field);
    setEditValue(field.value);
  };

  const handleOpenSelection = (field: InfoField) => {
    setActiveField(field);
    setShowSelectionModal(true);
  };

  const renderField = (field: InfoField, index: number) => {
    if (field.type === 'text') {
      return (
        <Animated.View
          key={field.id}
          entering={FadeIn.delay(index * 100)}
          className="mb-6"
        >
          <View className="flex-row items-center mb-2">
            <Ionicons name={field.icon as any} size={20} color="#7D5BA6" />
            <Text className="text-primary-dark font-montserratMedium ml-2">{field.label}</Text>
          </View>
          <View 
            className={`bg-neutral-lightest p-4 rounded-xl border ${field.editable ? 'border-neutral-medium' : 'border-neutral-medium/50'}`}
          >
            <TouchableOpacity
              onPress={() => field.editable && handleEditText(field)}
              disabled={!field.editable || isSaving}
              className="min-h-[28px] justify-center"
            >
              {field.value ? (
                <Text className="text-neutral-darkest font-montserrat">
                  {field.value}
                </Text>
              ) : (
                <Text className="text-neutral-dark/60 font-montserrat">
                  {field.placeholder}
                </Text>
              )}
            </TouchableOpacity>
            {!field.editable && (
              <View className="absolute right-3 top-3.5">
                <Ionicons name="lock-closed" size={16} color="#7D5BA6" />
              </View>
            )}
          </View>
        </Animated.View>
      );
    } else if (field.type === 'selection' && field.options) {
      return (
        <Animated.View
          key={field.id}
          entering={FadeIn.delay(index * 100)}
          className="mb-6"
        >
          <View className="flex-row items-center mb-2">
            <Ionicons name={field.icon as any} size={20} color="#7D5BA6" />
            <Text className="text-primary-dark font-montserratMedium ml-2">{field.label}</Text>
          </View>
          
          <View className="flex-row flex-wrap justify-between mt-2">
            {field.options.slice(0, 4).map((option, optionIndex) => (
              <Animated.View
                key={option.id}
                entering={FadeIn.delay(optionIndex * 100)}
                className="w-[48%] mb-4"
              >
                <TouchableOpacity
                  onPress={() => handleFieldChange(field.id, option.id)}
                  className={`p-3 rounded-2xl items-center justify-center shadow-sm ${
                    field.value === option.id 
                      ? 'bg-primary' 
                      : 'bg-neutral-lightest border border-neutral-medium'
                  }`}
                  style={{
                    elevation: field.value === option.id ? 4 : 1,
                  }}
                  disabled={!field.editable || isSaving}
                >
                  <View className={`p-3 rounded-xl ${
                    field.value === option.id ? 'bg-primary-light' : 'bg-neutral-medium/20'
                  }`}>
                    <Ionicons 
                      name={option.icon as any} 
                      size={24} 
                      color={field.value === option.id ? "#fff" : "#7D5BA6"} 
                    />
                  </View>
                  <Text className={`mt-2 font-montserratMedium ${
                    field.value === option.id ? 'text-white' : 'text-neutral-dark'
                  }`}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
            
            {field.options.length > 4 && (
              <TouchableOpacity
                onPress={() => field.editable && handleOpenSelection(field)}
                disabled={!field.editable || isSaving}
                className="w-full mt-2 p-3 rounded-xl border border-neutral-medium bg-neutral-lightest items-center"
              >
                <Text className="text-primary font-montserratMedium">
                  {field.value ? 'Change Selection' : 'See More Options'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-neutral-light justify-center items-center">
        <ActivityIndicator size="large" color="#7D5BA6" />
        <Text className="mt-4 text-primary font-montserrat">Loading profile...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-neutral-light">
      <Animated.View 
        entering={FadeInDown.duration(500)}
        className="bg-neutral-lightest px-6 pt-6 pb-4 border-b border-neutral-medium"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="flex-row items-center"
          >
            <Ionicons name="arrow-back" size={24} color="#7D5BA6" />
            <Text className="ml-2 text-primary font-montserratMedium">Back</Text>
          </TouchableOpacity>
          <Text className="text-lg font-youngSerif text-primary-dark">Edit Profile</Text>
          <TouchableOpacity 
            onPress={handleSave}
            disabled={isSaving || !hasChanges}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#7D5BA6" />
            ) : (
              <Text className={`font-montserratMedium ${hasChanges ? 'text-primary' : 'text-neutral-dark/40'}`}>
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      <ScrollView className="flex-1 p-6">
        <Text className="text-2xl font-youngSerif text-primary-dark mb-2">
          Personal Information
        </Text>
        <Text className="text-neutral-dark mb-6 font-montserrat">
          Edit your profile information below
        </Text>

        {fields.map(renderField)}

        <View className="h-20" />
      </ScrollView>

      {activeField?.type === 'text' && (
        <Animated.View 
          entering={FadeIn}
          className="absolute inset-0 bg-neutral-lightest px-6 pt-6"
        >
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={() => setActiveField(null)}>
              <Ionicons name="close" size={24} color="#7D5BA6" />
            </TouchableOpacity>
            <Text className="text-lg font-youngSerif text-primary-dark">Edit {activeField.label}</Text>
            <TouchableOpacity 
              onPress={() => {
                handleFieldChange(activeField.id, editValue);
                setActiveField(null);
              }}
            >
              <Text className="text-primary font-montserratMedium">Save</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            value={editValue}
            onChangeText={setEditValue}
            placeholder={activeField.placeholder}
            className="border-2 border-neutral-medium rounded-xl p-4 text-lg font-montserrat text-neutral-darkest"
            autoFocus
            multiline={activeField.id === 'bio'}
            numberOfLines={activeField.id === 'bio' ? 4 : 1}
            style={{ textAlignVertical: activeField.id === 'bio' ? 'top' : 'center' }}
          />
        </Animated.View>
      )}

      {/* <SelectionModal
        visible={showSelectionModal}
        options={activeField?.options || []}
        onSelect={(value: string) => {
          if (activeField) {
            handleFieldChange(activeField.id, value);
          }
        }}
        onClose={() => setShowSelectionModal(false)}
        currentValue={activeField?.value || ''}
        title={`Select ${activeField?.label}`}
      /> */}
    </View>
  );
} 