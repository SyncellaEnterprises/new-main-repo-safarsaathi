import { View, Text, TouchableOpacity, TextInput, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, SlideInRight } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

interface InfoField {
  id: string;
  label: string;
  value: string;
  editable: boolean;
  icon: string;
  placeholder: string;
}

export default function EditInfoScreen() {
  const router = useRouter();
  const [fields, setFields] = useState<InfoField[]>([
    {
      id: 'name',
      label: 'Full Name',
      value: 'Alex Johnson',
      editable: true,
      icon: 'person-outline',
      placeholder: 'Enter your full name'
    },
    {
      id: 'age',
      label: 'Age',
      value: '26',
      editable: false,
      icon: 'calendar-outline',
      placeholder: 'Your age'
    },
    {
      id: 'gender',
      label: 'Gender',
      value: 'Male',
      editable: false,
      icon: 'male-female-outline',
      placeholder: 'Your gender'
    },
    {
      id: 'occupation',
      label: 'Occupation',
      value: 'Software Engineer',
      editable: true,
      icon: 'briefcase-outline',
      placeholder: 'What do you do?'
    },
    {
      id: 'education',
      label: 'Education',
      value: 'Bachelor in Computer Science',
      editable: true,
      icon: 'school-outline',
      placeholder: 'Your education'
    },
    {
      id: 'languages',
      label: 'Languages',
      value: 'English, Hindi, Marathi',
      editable: true,
      icon: 'language-outline',
      placeholder: 'Languages you speak'
    }
  ]);

  const handleFieldChange = (id: string, newValue: string) => {
    setFields(prev => prev.map(field => 
      field.id === id ? { ...field, value: newValue } : field
    ));
  };

  const handleSave = () => {
    // Save logic here
    router.back();
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
          <TouchableOpacity onPress={handleSave}>
            <Text className="text-[#1a237e] font-semibold">Save</Text>
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

        {fields.map((field, index) => (
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
              />
              {!field.editable && (
                <View className="absolute right-3 top-3.5">
                  <Ionicons name="lock-closed" size={16} color="#1a237e" />
                </View>
              )}
            </View>
          </Animated.View>
        ))}

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