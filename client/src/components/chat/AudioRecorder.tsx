import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AudioRecorderProps {
  duration: number;
  onCancel: () => void;
}

export function AudioRecorder({ duration, onCancel }: AudioRecorderProps) {
  const [animatedWidth] = useState(new Animated.Value(0));
  const [recordingTime, setRecordingTime] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    Animated.timing(animatedWidth, {
      toValue: 1,
      duration: 500,
      useNativeDriver: false,
    }).start();

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Animated.View 
      style={{
        transform: [
          {
            translateY: animatedWidth.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0],
            }),
          },
        ],
      }}
      className="absolute bottom-20 left-4 right-4 bg-primary rounded-xl p-4"
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2" />
          <Text className="text-white font-medium">Recording {formatTime(recordingTime)}</Text>
        </View>
        
        <TouchableOpacity onPress={onCancel}>
          <Ionicons name="close-circle" size={24} color="white" />
        </TouchableOpacity>
      </View>
      
      <View className="h-1 bg-white/30 rounded-full mt-3">
        <Animated.View 
          className="h-1 bg-white rounded-full"
          style={{
            width: animatedWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          }}
        />
      </View>
    </Animated.View>
  );
} 