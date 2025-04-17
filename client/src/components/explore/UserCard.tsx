import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

const DEFAULT_PROFILE_IMAGE = 'https://filmfare.wwmindia.com/content/2024/aug/sharvariwaghinspiration31725098613.jpg';

interface UserCardProps {
  user: {
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
}

export function UserCard({ user }: UserCardProps) {
  if (!user) {
    return (
      <View style={styles.noProfileContainer}>
        <Text style={styles.noProfileText}>
          No more profiles available. Check back later!
        </Text>
      </View>
    );
  }

  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Process the profile photo
  const processProfilePhoto = () => {
    if (!user.profile_photo) return null;
    
    try {
      if (typeof user.profile_photo === 'string' && 
          (user.profile_photo.startsWith('{') || user.profile_photo.startsWith('['))) {
        const parsed = JSON.parse(user.profile_photo);
        return parsed.url || parsed[0]?.url || parsed;
      }
      return user.profile_photo;
    } catch (e) {
      console.error('Error processing profile photo:', e);
      return user.profile_photo;
    }
  };

  const profilePhoto = processProfilePhoto();
  const photoUrl = profilePhoto || DEFAULT_PROFILE_IMAGE;

  // Process interests to ensure it's always an array of strings
  const processInterests = () => {
    if (!user.interests) return [];
    
    if (Array.isArray(user.interests)) {
      return user.interests;
    }

    if (typeof user.interests === 'string') {
      return user.interests
        .replace(/[{}"]/g, '')
        .split(',')
        .map(i => i.trim())
        .filter(i => i);
    }
    
    return [];
  };

  const interestsArray = processInterests();

  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
      style={styles.container}
    >
      {/* Main Card with Gradient Border */}
      <LinearGradient
        colors={['#7D5BA6', '#50A6A7']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardBorder}
      >
        <View style={styles.cardContent}>
          {/* Profile Image - Fixed at top */}
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
            <LinearGradient
              colors={['rgba(0,0,0,0.6)', 'transparent']}
              style={styles.imageOverlay}
            />
            <View style={styles.verifiedBadge}>
              <BlurView intensity={80} tint="dark" style={styles.badgeContent}>
                <Ionicons name="checkmark-circle" size={14} color="#50A6A7" />
                <Text style={styles.badgeText}>Verified</Text>
              </BlurView>
            </View>
          </View>

          {/* Scrollable Content Section */}
          <ScrollView 
            style={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
            bounces={true}
          >
            <View style={styles.infoContainer}>
              <View style={styles.infoHeader}>
                <View>
                  <Text style={styles.userName}>
                    {user.username.replace('user_', '')}, {user.age || 'N/A'}
                  </Text>
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={16} color="#7D5BA6" />
                    <Text style={styles.infoText}>
                      {user.location || 'Location not specified'}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="briefcase-outline" size={16} color="#7D5BA6" />
                    <Text style={styles.infoText}>
                      {user.occupation || 'Occupation not specified'}
                    </Text>
                  </View>
                </View>
                <View style={styles.matchScore}>
                  <Text style={styles.matchText}>
                    {Math.round((user.similarity_score || 0) * 100)}%
                  </Text>
                </View>
              </View>

              {/* Gender */}
              <View style={styles.infoRow}>
                <Ionicons name="person-outline" size={16} color="#7D5BA6" />
                <Text style={styles.infoText}>
                  {user.gender || 'Gender not specified'}
                </Text>
              </View>

              {/* About Section */}
              {user.bio && (
                <View style={styles.bioSection}>
                  <Text style={styles.sectionTitle}>About</Text>
                  <Text style={styles.bioText}>{user.bio}</Text>
                </View>
              )}

              {/* Interests Section */}
              {interestsArray.length > 0 && (
                <View style={styles.interestsSection}>
                  <Text style={styles.sectionTitle}>Interests</Text>
                  <View style={styles.interestTags}>
                    {interestsArray.map((interest: string, index: number) => (
                      <View key={index} style={styles.interestTag}>
                        <Text style={styles.interestText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Prompts Section - Show all prompts */}
              {user.prompts?.prompts?.length > 0 && (
                <View style={styles.promptSection}>
                  <Text style={styles.sectionTitle}>Prompts</Text>
                  {user.prompts.prompts.map((prompt, index) => (
                    <BlurView key={index} intensity={10} tint="light" style={[styles.promptCard, { marginBottom: index < user.prompts.prompts.length - 1 ? 10 : 0 }]}>
                      <Text style={styles.promptQuestion}>{prompt.question}</Text>
                      <Text style={styles.promptAnswer}>{prompt.answer}</Text>
                    </BlurView>
                  ))}
                </View>
              )}

              {/* Match Score Details */}
              <View style={styles.matchDetailSection}>
                <Text style={styles.sectionTitle}>Match Score</Text>
                <View style={styles.matchDetailCard}>
                  <Text style={styles.matchDetailText}>
                    You are {Math.round((user.similarity_score || 0) * 100)}% compatible with {user.username.replace('user_', '')}
                  </Text>
                </View>
              </View>

              {/* Bottom padding for scrolling */}
              <View style={{ height: 20 }} />
            </View>
          </ScrollView>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
  },
  cardBorder: {
    flex: 1,
    padding: 2,
    borderRadius: 24,
  },
  cardContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 22,
    overflow: 'hidden',
  },
  noProfileContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
  },
  noProfileText: {
    fontSize: 18,
    color: '#333',
    textAlign: 'center',
    fontFamily: 'Montserrat',
  },
  imageContainer: {
    height: '45%', // Reduced height to make more room for scrollable content
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
    top: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontFamily: 'Montserrat-Medium',
  },
  scrollContainer: {
    flex: 1,
  },
  infoContainer: {
    padding: 16,
  },
  infoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userName: {
    fontSize: 24,
    fontFamily: 'YoungSerif-Regular',
    color: '#333',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontFamily: 'Montserrat',
  },
  matchScore: {
    backgroundColor: 'rgba(125, 91, 166, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  matchText: {
    color: '#7D5BA6',
    fontSize: 16,
    fontFamily: 'Montserrat-Bold',
  },
  bioSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    color: '#333',
    marginBottom: 10,
    fontFamily: 'YoungSerif-Regular',
  },
  bioText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    fontFamily: 'Montserrat',
  },
  interestsSection: {
    marginBottom: 20,
  },
  interestTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  interestTag: {
    backgroundColor: 'rgba(80, 166, 167, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    color: '#50A6A7',
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
  },
  promptSection: {
    marginBottom: 20,
  },
  promptCard: {
    padding: 12,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(125, 91, 166, 0.05)',
  },
  promptQuestion: {
    fontSize: 14,
    color: '#7D5BA6',
    marginBottom: 6,
    fontFamily: 'Montserrat-Medium',
  },
  promptAnswer: {
    fontSize: 14,
    color: '#666',
    fontFamily: 'Montserrat',
    lineHeight: 20,
  },
  matchDetailSection: {
    marginBottom: 16,
  },
  matchDetailCard: {
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(125, 91, 166, 0.1)',
  },
  matchDetailText: {
    fontSize: 14,
    color: '#7D5BA6',
    fontFamily: 'Montserrat-Medium',
    textAlign: 'center',
  },
});
