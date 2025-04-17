import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, SafeAreaView, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { UserCard } from '@/src/components/explore/UserCard';
import TabHeader from '@/src/components/shared/TabHeader';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

// Set API URL to your local server
const API_URL = 'http://10.0.2.2:5000';

interface RecommendationResponse {
  recommended_user_username: string;
  recommended_user_age: number;
  recommended_user_bio: string;
  recommended_user_created_at: string;
  recommended_user_gender: string;
  recommended_user_interest: string;
  recommended_user_location: string | null;
  recommended_user_occupation: string;
  recommended_user_photo: string | null;
  recommended_user_profile_id?: number;
  recommended_user_profile_user_id?: number;
  recommended_user_prompts: {
    prompts: Array<{
      question: string;
      answer: string;
    }>;
  };
  similarity_score: number;
}

interface LocationData {
  state?: string;
  city?: string;
  district?: string;
  latitude: number;
  longitude: number;
  address: string;
}

interface TransformedProfile {
  username: string;
  age: number;
  bio: string;
  gender: string;
  interests: string[];
  location: string;
  occupation: string;
  profile_photo: string | null;
  prompts: {
    prompts: Array<{
      question: string;
      answer: string;
    }>;
  };
  similarity_score: number;
  recommended_user_profile_id: number;
}

interface SwiperRef {
  swipeLeft: () => void;
  swipeRight: () => void;
}

interface ConfettiRef {
  start: () => void;
}

interface SwipeResponse {
  remaining_swipes: number;
  status: string;
  total_limit: number;
}

export default function ExploreScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipesRemaining, setSwipesRemaining] = useState(10); // Default value
  const [totalLimit, setTotalLimit] = useState(10); // Default value
  const [isLimited, setIsLimited] = useState(false);
  const [recommendations, setRecommendations] = useState<TransformedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Animation values
  const cardOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);
  const cardOffsetY = useSharedValue(0);

  // Check remaining swipes
  const checkRemainingSwipes = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token found');
      }

      console.log('Checking remaining swipes...');
      const response = await axios.post(
        `${API_URL}/api/swipes/remaining`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Remaining swipes response:', response.data);

      if (response.data.status === 'success') {
        setSwipesRemaining(response.data.remaining_swipes);
        setTotalLimit(response.data.total_limit);
        
        // If no swipes remaining, user is limited
        setIsLimited(response.data.remaining_swipes <= 0);
      }
    } catch (error: any) {
      console.error('Error checking remaining swipes:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to check remaining swipes'
      });
    }
  }, []);

  // Function to refetch everything - used for pull-to-refresh or retry button
  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    setCurrentIndex(0);
    await checkRemainingSwipes();
    await fetchRecommendations();
    setRefreshing(false);
  }, [checkRemainingSwipes]);

  // Load initial data
  useEffect(() => {
    const initializeScreen = async () => {
      try {
        setLoading(true);
        // First check swipes
        await checkRemainingSwipes();
        // Then fetch recommendations
        await fetchRecommendations();
      } catch (error) {
        console.error('Error initializing explore screen:', error);
      } finally {
        setLoading(false);
      }
    };

    initializeScreen();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await AsyncStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('No access token found');
      }

      // Step 1: Get recommended user IDs and similarity scores
      console.log('Fetching initial recommendations...');
      const recommendationResponse = await axios.post(
        `${API_URL}/user/recommendation`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000 // 15 seconds
        }
      );

      console.log('Initial recommendation IDs:', recommendationResponse.data);
      
      if (recommendationResponse.data.status !== 'success') {
        throw new Error('Failed to get initial recommendations');
      }

      // Create a map of profile IDs to similarity scores
      const profileMap = new Map<number, number>();
      recommendationResponse.data.recommended_users.forEach((id: number, index: number) => {
        profileMap.set(id, recommendationResponse.data.similarity_scores[index]);
      });

      // Step 2: Get detailed user profiles
      console.log('Fetching detailed profiles...');
      const detailedResponse = await axios.get(
        `${API_URL}/api/recommended_users/me`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Detailed profiles raw data:', detailedResponse.data);

      if (!detailedResponse.data?.recommended_users?.length) {
        throw new Error('No recommendations available');
      }

      // Transform the data
      const mappedProfiles: (TransformedProfile | null)[] = detailedResponse.data.recommended_users.map(
        (rec: RecommendationResponse) => {
          // Get profile ID from either field name (handle API inconsistency)
          const profileId = rec.recommended_user_profile_id || rec.recommended_user_profile_user_id;
          
          console.log('Processing profile with ID:', profileId);
          
          if (!profileId) {
            console.error('Missing profile ID in recommendation:', rec);
            // Instead of throwing error, log and skip this profile
            console.warn('Skipping profile due to missing ID');
            return null;
          }

          // Parse location data
          let locationText = 'Location not specified';
          if (rec.recommended_user_location) {
            try {
              const locationData: LocationData = JSON.parse(rec.recommended_user_location);
              locationText = locationData.city || locationData.district || 
                           locationData.state || locationData.address || 
                           'Location not specified';
            } catch (e) {
              console.error('Error parsing location:', e);
            }
          }

          // Parse interests
          const interestsStr = rec.recommended_user_interest || '';
          const interests = interestsStr
            .replace(/[{}"]/g, '') // Remove all braces and quotes
            .split(',')
            .map(i => i.trim())
            .filter(i => i);

          // Get similarity score from the map
          const similarity_score = profileMap.get(profileId) || rec.similarity_score || 0;

        
          return {
            username: rec.recommended_user_username,
            age: rec.recommended_user_age,
            bio: rec.recommended_user_bio,
            gender: rec.recommended_user_gender,
            interests: interests,
            location: locationText,
            occupation: rec.recommended_user_occupation,
            profile_photo: rec.recommended_user_photo,
            prompts: rec.recommended_user_prompts || { prompts: [] },
            similarity_score: similarity_score,
            recommended_user_profile_id: profileId
          };
        }
      );

      // Filter out any null entries (skipped profiles)
      const transformedProfiles: TransformedProfile[] = mappedProfiles.filter(
        (profile): profile is TransformedProfile => profile !== null
      );

      if (transformedProfiles.length === 0) {
        throw new Error('No valid profiles found');
      }

      // Sort by similarity score
      const sortedProfiles = transformedProfiles.sort(
        (a: TransformedProfile, b: TransformedProfile) => 
          b.similarity_score - a.similarity_score
      );

      console.log('Transformed profiles:', sortedProfiles);
      setRecommendations(sortedProfiles);

    } catch (error: any) {
      console.error('Fetch error:', {
        message: error.message,
        code: error.code,
        config: error.config,
        response: error.response?.data
      });
      const errorMessage = error.response?.data?.message || 
                         error.code === 'ECONNABORTED' ? 'Request timed out' :
                         error.message || 'Network error';
      setError(errorMessage);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  // Function to handle swipe action
  const handleSwipe = async (direction: string) => {
    if (isLimited) {
      Toast.show({
        type: 'info',
        text1: 'Limit Reached',
        text2: `Try again later when swipes reset`,
      });
      return;
    }

    if (!recommendations[currentIndex]) {
      return;
    }

    // Animate card out
    if (direction === 'right') {
      cardScale.value = withTiming(1.05, { duration: 200 });
      cardOpacity.value = withTiming(0, { duration: 300 });
      cardOffsetY.value = withTiming(-100, { duration: 300 });
    } else {
      cardScale.value = withTiming(0.95, { duration: 200 });
      cardOpacity.value = withTiming(0, { duration: 300 });
      cardOffsetY.value = withTiming(100, { duration: 300 });
    }

    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) throw new Error('No access token found');

      const targetUsername = recommendations[currentIndex].username;
      const apiPayload = {
        target_username: targetUsername,
        direction: direction === 'right' ? 'right' : 'left'
      };

      const swipeResponse = await axios.post(
        `${API_URL}/api/swipe`,
        apiPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        }
      );

      if (swipeResponse.data.status === 'success') {
        setSwipesRemaining(swipeResponse.data.remaining_swipes);
        setTotalLimit(swipeResponse.data.total_limit);
        setIsLimited(swipeResponse.data.remaining_swipes <= 0);
      }

      // Check for matches only after successful right swipe
      if (direction === 'right' && swipeResponse.data.status === 'success') {
        try {
          const matchResponse = await axios.get(
            `${API_URL}/api/matches/me`,
            {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            }
          );

          if (matchResponse.data?.matches?.length > 0) {
            const isMatch = matchResponse.data.matches.some(
              (match: any) => match.matched_username === targetUsername
            );

            if (isMatch) {
              Toast.show({
                type: 'success',
                text1: 'Match! 🎉',
                text2: `You matched with ${targetUsername}!`,
                visibilityTime: 4000,
                autoHide: true,
                topOffset: 60
              });
            }
          }
        } catch (matchError: any) {
          console.error('Match check error:', matchError);
        }
      }

      // Update index and reset animation values after a small delay
      setTimeout(() => {
        setCurrentIndex(prev => Math.min(prev + 1, recommendations.length - 1));
        cardOpacity.value = withTiming(1, { duration: 300 });
        cardScale.value = withTiming(1, { duration: 300 });
        cardOffsetY.value = withTiming(0, { duration: 300 });
      }, 300);

    } catch (error: any) {
      console.error('Swipe error:', error);
      
      const errorMessage = error.response?.data?.message || 
                        error.response?.status === 404 ? 'Endpoint not found or invalid username' :
                        error.message || 'Swipe failed';

      Toast.show({ 
        type: 'error', 
        text1: 'Swipe Error', 
        text2: errorMessage,
        visibilityTime: 3000
      });
      
      // Reset animation
      cardOpacity.value = withTiming(1, { duration: 300 });
      cardScale.value = withTiming(1, { duration: 300 });
      cardOffsetY.value = withTiming(0, { duration: 300 });
    }
  };

  const animatedCardStyle = useAnimatedStyle(() => {
    return {
      opacity: cardOpacity.value,
      transform: [
        { scale: cardScale.value },
        { translateY: cardOffsetY.value }
      ]
    };
  });

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <TabHeader
          title="Explore"
          leftIcon="people-outline"
          rightIcon="filter-outline"
          onLeftPress={() => router.push("/(tabs)/connections" as any)}
          onRightPress={() => router.push("/(tabs)/filters" as any)}
          gradientColors={['rgba(125, 91, 166, 0.9)', 'rgba(90, 65, 128, 0.8)']}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.loadingText}>Finding your matches...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || recommendations.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <TabHeader
          title="Explore"
          leftIcon="people-outline"
          rightIcon="filter-outline"
          onLeftPress={() => router.push("/(tabs)/connections" as any)}
          onRightPress={() => router.push("/(tabs)/filters" as any)}
          gradientColors={['rgba(125, 91, 166, 0.9)', 'rgba(90, 65, 128, 0.8)']}
        />
        <View style={styles.errorContainer}>
          <BlurView intensity={20} style={styles.errorBlur}>
            <Ionicons name="search" size={48} color="#fff" />
            <Text style={styles.errorText}>
              {error || 'No recommendations found'}
            </Text>
            <TouchableOpacity 
              onPress={refreshAll}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </BlurView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TabHeader
        title="Explore"
        leftIcon="people-outline"
        rightIcon="filter-outline"
        onLeftPress={() => router.push("/(tabs)/connections" as any)}
        onRightPress={() => router.push("/(tabs)/filters" as any)}
        gradientColors={['rgba(125, 91, 166, 0.9)', 'rgba(90, 65, 128, 0.8)']}
        subtitle={isLimited ? `Swipes Reset Soon` : `${swipesRemaining}/${totalLimit} swipes left`}
      />

      <View style={styles.cardContainer}>
        {refreshing ? (
          <View style={styles.refreshOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        ) : null}
        
        {/* Profile Card */}
        {recommendations.length > currentIndex && (
          <Animated.View style={[styles.cardWrapper, animatedCardStyle]}>
            <UserCard user={recommendations[currentIndex]} />
          </Animated.View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.dislikeButton} 
            onPress={() => handleSwipe('left')}
            disabled={isLimited || currentIndex >= recommendations.length}
          >
            <LinearGradient
              colors={['#FF3B30', '#FF6E67']}
              style={styles.gradientButton}
            >
              <Ionicons name="close" size={32} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => handleSwipe('right')}
            disabled={isLimited || currentIndex >= recommendations.length}
          >
            <LinearGradient
              colors={['#50A6A7', '#7CD3D4']}
              style={styles.gradientButton}
            >
              <Ionicons name="heart" size={32} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={refreshAll}
          style={styles.refreshButton}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1D1B26',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFF',
    marginTop: 16,
    fontFamily: 'Montserrat',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorBlur: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    width: '100%',
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
    fontFamily: 'YoungSerif-Regular',
    marginTop: 16,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryText: {
    color: '#FFF',
    fontFamily: 'Montserrat-Medium',
    fontSize: 16,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  cardWrapper: {
    width: '100%',
    height: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 32,
    marginTop: 24,
  },
  dislikeButton: {
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 5,
  },
  likeButton: {
    shadowColor: '#50A6A7',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5, 
    shadowRadius: 5,
    elevation: 5,
  },
  gradientButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
  },
  refreshButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 10,
    borderRadius: 20,
  },
  refreshOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
}); 