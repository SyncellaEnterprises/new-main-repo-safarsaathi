import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface SearchBarProps {
  onFocus?: () => void;
  onBlur?: () => void;
}

export function SearchBar({ onFocus, onBlur }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color="#FFFFFF" />
        <TextInput
          style={styles.input}
          placeholder="Mumbai"
          placeholderTextColor="rgba(255,255,255,0.7)"
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 1,
    paddingHorizontal: 15,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 27, 38, 0.7)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 15,
  },
  input: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: '#FFFFFF',
    fontFamily: 'Montserrat',
  },
});