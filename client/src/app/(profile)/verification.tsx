import { View, Text, TouchableOpacity, Image, ScrollView, Modal, Platform, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, SlideInRight, SlideInUp, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect, useRef } from "react";
import React from "react";
import { useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  status: 'pending' | 'completed' | 'current';
}

export default function VerificationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();
  const toast = useToast();
  const videoRef = useRef<Video>(null);
  
  const [cameraVisible, setCameraVisible] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingCompleted, setRecordingCompleted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [loading, setLoading] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [tutorialVisible, setTutorialVisible] = useState(true);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const [steps, setSteps] = useState<VerificationStep[]>([
    {
      id: '1',
      title: 'Video Verification',
      description: 'Record a 5 second video selfie',
      icon: 'camera-outline',
      status: 'current'
    },
    {
      id: '2',
      title: 'Profile Review',
      description: 'Our team will review within 24 hours',
      icon: 'shield-checkmark-outline',
      status: 'pending'
    }
  ]);

  // Animation for modal
  const modalPosition = useSharedValue(100);
  
  const modalStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: `${modalPosition.value}%` }],
    };
  });

  useEffect(() => {
    // Auto-play the tutorial video when the modal opens
    if (cameraVisible && videoRef.current) {
      playTutorialVideo();
    }
  }, [cameraVisible]);

  const playTutorialVideo = async () => {
    if (videoRef.current) {
      try {
        await videoRef.current.playAsync();
        await videoRef.current.setIsLoopingAsync(true);
      } catch (error) {
        console.error("Could not play tutorial video:", error);
      }
    }
  };

  const handleStartVerification = async () => {
    // Request camera permissions if not already granted
    if (!permission?.granted) {
      const newPermission = await requestPermission();
      if (!newPermission.granted) {
        toast.show("Camera permission is required for verification", "error");
        return;
      }
    }
    
    // Show tutorial screen before recording
    setCameraVisible(true);
    modalPosition.value = withTiming(0, { duration: 300 });
  };
  
  const startRecording = async () => {
    // Open camera directly to record video
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        aspect: [9, 16],
        quality: 1,
        videoMaxDuration: 5, // Auto-stop after 5 seconds
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        const videoAsset = result.assets[0];
        console.log("Video recorded:", videoAsset);
        setVideoUri(videoAsset.uri);
        
        // Show the review screen with OK/Retry options
        setRecordingCompleted(true);
      } else {
        console.log("Camera was canceled");
      }
    } catch (error) {
      console.error("Camera error:", error);
      toast.show("Failed to open camera. Please try again.", "error");
    }
  };

  const handleCloseModal = () => {
    modalPosition.value = withTiming(100, { duration: 300 });
    setTimeout(() => {
      setCameraVisible(false);
      setRecordingCompleted(false);
    }, 300);
  };
  
  const retryRecording = () => {
    setVideoUri(null);
    setRecordingCompleted(false);
    startRecording();
  };
  
  const submitVerification = async () => {
    if (!videoUri) {
      toast.show("No video recorded. Please record a video first.", "error");
      return;
    }
    
    if (!accessToken) {
      toast.show("You need to be logged in to verify your profile", "error");
      return;
    }
    
    setLoading(true);
    
    try {
      // Create form data with the video file
      const formData = new FormData();
      
      // Add the actual video file from camera
      formData.append('video', {
        uri: videoUri,
        type: 'video/mp4', 
        name: 'verification.mp4',
      } as any);
      
      // Get API base URL based on platform
      const API_BASE = __DEV__ 
        ? Platform.select({
          ios: 'http://localhost:5000/api',
          android: 'http://10.0.2.2:5000/api',
        })
        : 'http://192.168.0.108:5000/api';
      
      console.log("Submitting actual video to API:", `${API_BASE}/onboarding/videos`);
      console.log("Video URI:", videoUri);
      
      // Make API request with bearer token from AuthContext
      const response = await fetch(`${API_BASE}/onboarding/videos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });
      
      console.log("Response status:", response.status);
      
      if (response.ok) {
        let data;
        try {
          data = await response.json();
          console.log("Upload success, response:", data);
        } catch (e) {
          console.log("Response received but not JSON:", response.status, response.statusText);
        }
        
        // Show success toast
        toast.show("Video uploaded successfully!", "success");
        
        // Update steps status
        setSteps(prev => 
          prev.map(step => 
            step.id === '1' 
              ? {...step, status: 'completed'} 
              : step.id === '2' 
                ? {...step, status: 'current'} 
                : step
          )
        );
        
        // Close modal
        handleCloseModal();
      } else {
        let errorMessage = "Failed to upload video. Please try again.";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          console.log("Error response:", errorData);
        } catch (e) {
          console.log("Error response not JSON:", response.status, response.statusText);
        }
        
        toast.show(errorMessage, "error");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.show("Network error. Please check your connection and try again.", "error");
    } finally {
      setLoading(false);
    }
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
          <Text className="text-lg font-semibold text-[#1a237e]">Get Verified</Text>
          <View style={{ width: 60 }} />
        </View>
      </Animated.View>

      <ScrollView className="flex-1 p-6">
        <View className="bg-indigo-50 p-4 rounded-xl mb-8">
          <View className="flex-row items-center">
            <Ionicons name="shield-checkmark" size={24} color="#1a237e" />
            <View className="ml-3 flex-1">
              <Text className="text-lg font-semibold text-[#1a237e]">
                Why Get Verified?
              </Text>
              <Text className="text-slate-600 mt-1">
                Verified profiles get 2x more matches and unlock premium features
              </Text>
            </View>
          </View>
        </View>

        {steps.map((step, index) => (
          <Animated.View
            key={step.id}
            entering={SlideInRight.delay(index * 200)}
            className={`mb-4 ${
              index !== steps.length - 1 ? 'border-l-2 border-slate-200 pb-6' : ''
            }`}
          >
            <View className={`
              relative flex-row items-center bg-white p-4 rounded-xl
              ${step.status === 'current' ? 'border-2 border-[#1a237e]' : ''}
            `}>
              <View className={`
                w-12 h-12 rounded-full items-center justify-center
                ${step.status === 'completed' ? 'bg-green-100' :
                  step.status === 'current' ? 'bg-indigo-50' : 'bg-slate-100'}
              `}>
                <Ionicons 
                  name={step.status === 'completed' ? 'checkmark' : step.icon as any}
                  size={24}
                  color={step.status === 'completed' ? '#22c55e' :
                    step.status === 'current' ? '#1a237e' : '#94a3b8'}
                />
              </View>
              <View className="ml-4 flex-1">
                <Text className={`font-semibold ${
                  step.status === 'current' ? 'text-[#1a237e]' : 'text-slate-800'
                }`}>
                  {step.title}
                </Text>
                <Text className="text-slate-500">{step.description}</Text>
              </View>
              {step.status === 'current' && step.id === '1' && (
                <TouchableOpacity 
                  className="bg-[#1a237e] px-4 py-2 rounded-full"
                  onPress={handleStartVerification}
                >
                  <Text className="text-white font-semibold">Start</Text>
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        ))}

        <View className="mt-6 bg-indigo-50 p-4 rounded-xl">
          <Text className="text-slate-600 text-center">
            Verification takes 24 hours after submission
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={cameraVisible}
        transparent={true}
        animationType="none"
        onRequestClose={handleCloseModal}
      >
        <Animated.View 
          style={[
            { flex: 1, backgroundColor: 'black' },
            modalStyle
          ]}
          className="absolute inset-0"
        >
          <StatusBar barStyle="light-content" />
          <View style={{ 
            paddingTop: insets.top || 40,
            paddingBottom: insets.bottom || 20,
            flex: 1 
          }}>
            <View className="flex-row items-center justify-between px-6 py-3">
              <TouchableOpacity onPress={handleCloseModal}>
                <Ionicons name="close" size={28} color="white" />
              </TouchableOpacity>
              <Text className="text-lg font-semibold text-white">Video Verification</Text>
              <View style={{ width: 28 }} />
            </View>

            <View className="flex-1 items-center justify-center bg-black">
              {!recordingCompleted ? (
                <View className="items-center w-full">
                  {/* Tutorial instructions */}
                  <Video
                    ref={videoRef}
                    source={require('../../../assets/images/tutorialVerification.mp4')}
                    style={{ width: 280, height: 280, borderRadius: 12, marginBottom: 20 }}
                    useNativeControls={false}
                    resizeMode={ResizeMode.COVER}
                  />
                  
                  <View className="px-6 mb-8">
                    <Text className="text-white text-lg font-semibold mb-2 text-center">
                      Recording Instructions:
                    </Text>
                    <Text className="text-gray-300 text-center mb-3">
                      • Look directly at the camera
                    </Text>
                    <Text className="text-gray-300 text-center mb-3">
                      • Make sure your face is clearly visible
                    </Text>
                    <Text className="text-gray-300 text-center mb-3">
                      • Video will automatically stop after 5 seconds
                    </Text>
                  </View>
                  
                  <TouchableOpacity 
                    className="bg-[#1a237e] px-8 py-4 rounded-full"
                    onPress={startRecording}
                  >
                    <Text className="text-white font-semibold text-lg">
                      Start Recording
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View className="items-center w-full">
                  <View className="w-80 h-80 rounded-xl bg-gray-800 items-center justify-center mb-4 overflow-hidden">
                    {videoUri ? (
                      <Video
                        source={{ uri: videoUri }}
                        style={{ width: '100%', height: '100%' }}
                        useNativeControls={true}
                        resizeMode={ResizeMode.COVER}
                      />
                    ) : (
                      <Ionicons name="checkmark-circle" size={80} color="#1a237e" />
                    )}
                  </View>
                  
                  <Text className="text-white text-lg mb-4">Video recorded successfully!</Text>
                  <Text className="text-gray-400 text-center mb-6 px-4">
                    Would you like to submit this video or try again?
                  </Text>
                  
                  <View className="flex-row justify-center space-x-4">
                    <TouchableOpacity 
                      className="bg-gray-700 px-6 py-3 rounded-full"
                      onPress={retryRecording}
                      disabled={loading}
                    >
                      <Text className="text-white font-semibold">Retry</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      className="bg-[#1a237e] px-6 py-3 rounded-full"
                      onPress={submitVerification}
                      disabled={loading}
                    >
                      <Text className="text-white font-semibold">
                        {loading ? "Uploading..." : "OK, Submit"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Animated.View>
      </Modal>
    </View>
  );
} 