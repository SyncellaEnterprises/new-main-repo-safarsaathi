import React from 'react';
import { TouchableOpacity, Text, Image, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ConnectionCardProps {
  connection: {
    id: string;
    name: string;
    avatar: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  onPress: () => void;
}

export function ConnectionCard({ connection, onPress }: ConnectionCardProps) {
  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onPress}
      className="bg-neutral-lightest rounded-xl shadow-sm overflow-hidden"
    >
      <Image 
        source={{ uri: connection.avatar }} 
        style={styles.avatar} 
        className="border-2 border-primary-light"
      />
      <Text className="text-neutral-dark font-montserratMedium text-sm mt-2 text-center">
        {connection.name}
      </Text>
      <View className="flex-row items-center mt-1 justify-center">
        <Ionicons name="location" size={12} color="#7D5BA6" />
        <Text className="text-primary-dark text-xs font-montserrat ml-1">
          {Math.round(Math.random() * 10)} km
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 10,
    alignItems: 'center',
    width: 100,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
});

export default ConnectionCard;