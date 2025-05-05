import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

const { width, height } = Dimensions.get('window');

const DEFAULT_PROFILE_IMAGE = 'https://filmfare.wwmindia.com/content/2024/aug/sharvariwaghinspiration31725098613.jpg';

export interface UserCardProps {
  profile: {
    username: string;
    location: string;
    interests: string[] | string;
    similarity_score: number;
    age: number;
    bio: string;
    gender: string;
    occupation: string;
    profile_photo: string | null;
    prompts: {
      prompts: Array<{
        question: string;
        answer: string;
      }>;
    };
    recommended_user_profile_id: number;
  };
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}

export function UserCard({ profile, onSwipeLeft, onSwipeRight }: UserCardProps) {
  if (!profile) {
    return (
      <View style={styles.noProfileContainer}>
        <Ionicons name="alert-circle-outline" size={56} color="#DDDDDD" style={{ marginBottom: 16 }} />
        <Text style={styles.noProfileText}>
          No more profiles available. Check back later!
        </Text>
      </View>
    );
  }

  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Process the profile photo
  const processProfilePhoto = () => {
    if (!profile.profile_photo) return null;
    
    try {
      if (typeof profile.profile_photo === 'string' && 
          (profile.profile_photo.startsWith('{') || profile.profile_photo.startsWith('['))) {
        const parsed = JSON.parse(profile.profile_photo);
        return parsed.url || parsed[0]?.url || parsed;
      }
      return profile.profile_photo;
    } catch (e) {
      console.error('Error processing profile photo:', e);
      return profile.profile_photo;
    }
  };

  const profilePhoto = processProfilePhoto();
  const photoUrl = profilePhoto || DEFAULT_PROFILE_IMAGE;

  // Process interests to ensure it's always an array of strings
  const processInterests = () => {
    if (!profile.interests) return [];
    
    if (Array.isArray(profile.interests)) {
      return profile.interests;
    }

    if (typeof profile.interests === 'string') {
      return profile.interests
        .replace(/[{}"]/g, '')
        .split(',')
        .map(i => i.trim())
        .filter(i => i);
    }
    
    return [];
  };

  const interestsArray = processInterests();
  const matchScore = Math.round((profile.similarity_score || 0) * 100);

  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
      style={styles.container}
    >
      <View style={styles.cardContent}>
        {/* Profile Image Section */}
        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#7D5BA6" />
            </View>
          )}
          <Image
            source={{ uri: imageError ? DEFAULT_PROFILE_IMAGE : photoUrl }}
            style={styles.profileImage}
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageLoading(false);
              setImageError(true);
            }}
          />
          
          {/* Gradient overlays for better text visibility */}
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.3)', 'transparent']}
            style={[styles.imageOverlay, { height: 100 }]}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.6)']}
            style={[styles.imageOverlay, { bottom: 0, height: 120 }]}
          />
          
          {/* Verified badge */}
          <View style={styles.verifiedBadge}>
            <BlurView intensity={90} tint="dark" style={styles.badgeContent}>
              <Ionicons name="checkmark-circle" size={14} color="#50A6A7" />
              <Text style={styles.badgeText}>Verified</Text>
            </BlurView>
          </View>
          
          {/* Username overlay on image */}
          <View style={styles.imageUsernameContainer}>
            <Text style={styles.imageUsername}>
              {profile.username.replace('user_', '')}, {profile.age || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          {/* Basic Info with Icons */}
          <View style={styles.basicInfoContainer}>
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={16} color="#7D5BA6" style={styles.infoIcon} />
              <Text style={styles.infoText}>{profile.location || 'Location not specified'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="briefcase-outline" size={16} color="#7D5BA6" style={styles.infoIcon} />
              <Text style={styles.infoText}>{profile.occupation || 'Occupation not specified'}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <Ionicons name="person-outline" size={16} color="#7D5BA6" style={styles.infoIcon} />
              <Text style={styles.infoText}>{profile.gender || 'Gender not specified'}</Text>
            </View>
          </View>
          
          {/* Match Score */}
          <View style={styles.matchScoreContainer}>
            <LinearGradient
              colors={matchScore > 70 ? ['#7D5BA6', '#50A6A7'] : ['#7D5BA6', '#7D5BA6']}
              style={styles.matchScoreGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.matchText}>{matchScore}%</Text>
              <Text style={styles.matchLabel}>Match</Text>
            </LinearGradient>
          </View>
        </View>

        {/* Force scrolling with a Pressable wrapper to intercept swipe gestures */}
        <Pressable style={styles.scrollWrapper} onTouchStart={(e) => e.stopPropagation()}>
          <ScrollView 
            ref={scrollViewRef}
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            contentContainerStyle={{ paddingBottom: 20 }}
          >
            {/* About Section */}
            {profile.bio && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="information-circle-outline" size={18} color="#7D5BA6" />
                  <Text style={styles.sectionTitle}>About</Text>
                </View>
                <Text style={styles.bioText}>{profile.bio}</Text>
              </View>
            )}

            {/* Interests Section */}
            {interestsArray.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="heart-outline" size={18} color="#7D5BA6" />
                  <Text style={styles.sectionTitle}>Interests</Text>
                </View>
                <View style={styles.interestTags}>
                  {interestsArray.map((interest: string, index: number) => (
                    <View key={index} style={styles.interestTag}>
                      <Text style={styles.interestText}>{interest}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Prompts Section */}
            {profile.prompts?.prompts?.length > 0 && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="chatbubble-outline" size={18} color="#7D5BA6" />
                  <Text style={styles.sectionTitle}>Prompts</Text>
                </View>
                {profile.prompts.prompts.map((prompt, index) => (
                  <View key={index} style={styles.promptCard}>
                    <Text style={styles.promptQuestion}>{prompt.question}</Text>
                    <Text style={styles.promptAnswer}>{prompt.answer}</Text>
                  </View>
                ))}
              </View>
            )}
            
            {/* Extra space for scrolling */}
            <View style={{ height: 40 }} />
          </ScrollView>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#7D5BA6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 70,
  },
  cardContent: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 24,
    overflow: 'hidden',
  },
  noProfileContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#7D5BA6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noProfileText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  imageContainer: {
    height: 380,
    width: '100%',
    position: 'relative',
  },
  loaderContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    zIndex: 1,
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
  },
  imageUsernameContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  imageUsername: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold', 
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  infoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  basicInfoContainer: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoIcon: {
    marginRight: 8,
    width: 20,
    textAlign: 'center',
  },
  infoText: {
    fontSize: 14,
    color: '#555',
  },
  matchScoreContainer: {
    marginLeft: 10,
  },
  matchScoreGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  matchLabel: {
    color: 'white',
    fontSize: 11,
    marginTop: -2,
  },
  scrollContainer: {
    flex: 1,
  },
  sectionContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
    marginLeft: 8,
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 5,
  },
  interestTag: {
    backgroundColor: 'rgba(125, 91, 166, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(125, 91, 166, 0.1)',
  },
  interestText: {
    color: '#7D5BA6',
    fontSize: 13,
    fontWeight: '500',
  },
  promptCard: {
    padding: 14,
    backgroundColor: 'rgba(80, 166, 167, 0.06)',
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(80, 166, 167, 0.1)',
  },
  promptQuestion: {
    fontSize: 14,
    color: '#7D5BA6',
    fontWeight: '600',
    marginBottom: 6,
  },
  promptAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  scrollWrapper: {
    flex: 1,
    width: '100%',
  },
});
