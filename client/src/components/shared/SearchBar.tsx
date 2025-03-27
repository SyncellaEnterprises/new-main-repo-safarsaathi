import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';

interface SearchBarProps {
  onFocus?: () => void;
  onBlur?: () => void;
  onSearch?: (text: string) => void;
  placeholder?: string;
  value?: string;
  style?: any;
}

export function SearchBar({ 
  onFocus, 
  onBlur, 
  onSearch, 
  placeholder = "Search...",
  value,
  style,
}: SearchBarProps) {
  return (
    <Animated.View 
      entering={FadeIn.duration(500)}
      style={[styles.container, style]}
    >
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#fff" />
          <TextInput
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.6)"
            style={styles.input}
            onFocus={onFocus}
            onBlur={onBlur}
            onChangeText={onSearch}
            value={value}
          />
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="options-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 100,
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 15,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  input: {
    flex: 1,
    color: '#fff',
    marginLeft: 10,
    fontSize: 16,
  },
  filterButton: {
    padding: 5,
  },
});
