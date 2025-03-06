import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInRight, FadeInDown } from 'react-native-reanimated';
import { TravelSuggestion } from '@/src/types/calendar';
import { MOCK_HOLIDAYS, MOCK_SUGGESTIONS, SPECIAL_DATES } from '@/src/constants/calendar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

export default function TripCalendarScreen() {
  const router = useRouter();

  // State variables
  const [selectedDates, setSelectedDates] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filteredSuggestions, setFilteredSuggestions] = useState<TravelSuggestion[]>([]);

  // Simplified marked dates
  const markedDates = {
    ...selectedDates,
    ...MOCK_HOLIDAYS.reduce((acc, holiday) => ({
      ...acc,
      [holiday.date]: { marked: true, dotColor: '#FF4B4B' },
    }), {}),
    ...SPECIAL_DATES.reduce((acc, date) => ({
      ...acc,
      [date]: { marked: true, dotColor: '#00FF00' },
    }), {}),
  };

  // Updated filter logic to handle month changes from calendar
  useEffect(() => {
    const filtered = MOCK_SUGGESTIONS.filter(suggestion => {
      const suggestionDate = new Date(suggestion.dates.start);
      return (
        suggestionDate.getMonth() === selectedMonth.getMonth() &&
        suggestionDate.getFullYear() === selectedMonth.getFullYear()
      );
    });
    setFilteredSuggestions(filtered as []);
  }, [selectedMonth]);

  return (
    <View className="flex-1 bg-[#1a237e]">
      <LinearGradient
        colors={['#1a237e', '#283593', '#3949ab']}
        className="flex-1"
      >
        {/* Header */}
        <View className="pt-14 px-6 pb-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-white">Trip Calendar</Text>
            <TouchableOpacity 
              className="w-10 h-10 bg-white/10 rounded-full items-center justify-center"
            >
              <Ionicons name="add" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Calendar */}
          <Animated.View 
            entering={FadeInDown.delay(200)}
            className="mx-6 mb-6"
          >
            <Calendar
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: '#fff',
                selectedDayBackgroundColor: '#3949ab',
                selectedDayTextColor: '#fff',
                todayTextColor: '#3949ab',
                dayTextColor: '#fff',
                textDisabledColor: '#ffffff50',
                dotColor: '#3949ab',
                monthTextColor: '#fff',
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '500',
              }}
              markedDates={{
                '2024-03-16': {selected: true, marked: true},
                '2024-03-20': {marked: true, dotColor: '#50cebb'},
              }}
            />
          </Animated.View>

          {/* Upcoming Trips */}
          <Animated.View 
            entering={FadeInDown.delay(400)}
            className="px-6"
          >
            <Text className="text-white text-xl font-bold mb-4">Upcoming Trips</Text>
            {[1, 2, 3].map((_, index) => (
              <TouchableOpacity 
                key={index}
                className="bg-white/10 backdrop-blur-lg rounded-2xl p-4 mb-4"
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className="text-white font-semibold">Mumbai to Goa</Text>
                  <View className="bg-indigo-500/20 px-3 py-1 rounded-full">
                    <Text className="text-white">Mar 16</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <Ionicons name="people-outline" size={16} color="#fff" />
                  <Text className="text-white/70 ml-1">4 travelers</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>

          {/* Leave space for bottom tab */}
          <View className="h-32" />
        </ScrollView>
      </LinearGradient>
    </View>
  );
}
