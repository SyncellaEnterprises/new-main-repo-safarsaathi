import React, { useEffect, useState, useRef, useCallback } from 'react';
import MapView, { PROVIDER_GOOGLE, Heatmap, Marker, Callout } from 'react-native-maps';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Image, Platform, Dimensions, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

// Set API URL to your local server (same as in explore.tsx)
const API_URL = 'http://10.0.2.2:5000';

// Default profile image if none provided
const DEFAULT_PROFILE_IMAGE = 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.etvbharat.com%2Fen%2F!entertainment%2Fdressed-in-saree-sharvari-wagh-sends-festive-greetings-prays-for-alpha-on-dussehra-enn24101201536&psig=AOvVaw00wrwqm2ec-4gylA7pH1xF&ust=1743942436672000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCMjJ7PzxwIwDFQAAAAAdAAAAABAE';

// Match interface with added location parsing
interface Match {
  username: string;
  userId: number;
  email: string;
  interests: string;
  matchDate: string;
  bio: string;
  profile_photo?: string | null;
  location?: string;
  parsedLocation?: {
    state?: string;
    city?: string;
    district?: string;
    latitude: number;
    longitude: number;
    address: string;
  };
}

// Places of interest can remain the same for now
const PLACES_OF_INTEREST = [
  {
    id: '1',
    name: 'The Capital Mall',
    type: 'Top Pick',
    coordinates: {
      latitude: 19.0790,
      longitude: 72.8800,
    },
    icon: '🛍️'
  },
  {
    id: '2',
    name: 'M.S. College',
    type: 'Top Pick',
    coordinates: {
      latitude: 19.0740,
      longitude: 72.8820,
    },
    icon: '🎓'
  },
  // Add more places as needed
];

export default function LocationScreen() {
  const router = useRouter();
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 19.0760,
    longitude: 72.8777,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showGhostMode, setShowGhostMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize with user's current location
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          ...currentLocation,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
        
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  // Fetch matches from API
  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      
      // Get JWT token
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      // Make API request to get matches
      console.log('Fetching matches for map...');
      const response = await axios.get(`${API_URL}/api/matches/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Map matches response:', response.data);

      if (response.data.matches && response.data.matches.length > 0) {
        // Parse location data for each match
        const matchesWithParsedLocation = response.data.matches.map((match: Match) => {
          // Try to parse the location string if it exists
          if (match.location) {
            try {
              const parsedLocation = JSON.parse(match.location);
              return {
                ...match,
                parsedLocation
              };
            } catch (e) {
              console.error('Error parsing location for', match.username, e);
              return match;
            }
          }
          return match;
        });

        // Filter out matches without valid location data
        const validMatches = matchesWithParsedLocation.filter(
          (match: Match) => match.parsedLocation && 
                  match.parsedLocation.latitude && 
                  match.parsedLocation.longitude
        );

        setMatches(validMatches);
        
        // If we have matches with locations, center the map on the first one
        if (validMatches.length > 0 && validMatches[0].parsedLocation) {
          const firstMatch = validMatches[0];
          setCurrentLocation({
            latitude: firstMatch.parsedLocation.latitude,
            longitude: firstMatch.parsedLocation.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          });
        }
      } else {
        setMatches([]);
        // If no matches, just use the user's location
        getUserLocation();
      }
    } catch (error: any) {
      console.error('Error fetching matches for map:', error);
      setError(error.message || 'Failed to fetch matches');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load matches for map'
      });
      // If there's an error, still try to get user location
      getUserLocation();
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    getUserLocation();
    fetchMatches();
  }, []);

  // Render a match marker
  const renderUserMarker = (match: Match) => {
    if (!match.parsedLocation) return null;
    
    return (
      <Marker
        key={match.userId.toString()}
        coordinate={{
          latitude: match.parsedLocation.latitude,
          longitude: match.parsedLocation.longitude
        }}
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <View style={styles.markerContainer}>
          <Image 
            source={{ uri: match.profile_photo || DEFAULT_PROFILE_IMAGE }}
            style={styles.markerImage}
            defaultSource={require('@/assets/images/avatar.png')}
          />
          <View style={styles.markerBadge}>
            <Text style={styles.markerTime}>
              {match.username}
            </Text>
          </View>
        </View>
        <Callout tooltip onPress={() => router.push(`/chat/${match.userId}`)}>
          <BlurView intensity={30} tint="dark" style={styles.calloutContainer}>
            <View style={styles.calloutHeader}>
              <Image 
                source={{ uri: match.profile_photo || DEFAULT_PROFILE_IMAGE }}
                style={styles.calloutImage}
                defaultSource={require('@/assets/images/avatar.png')}
              />
              <View style={styles.calloutInfo}>
                <Text style={styles.calloutName}>{match.username}</Text>
                <Text style={styles.calloutStatus}>{match.interests}</Text>
                <Text style={styles.calloutLocation}>
                  📍 {match.parsedLocation.city || match.parsedLocation.state || 'Location not specified'}
                </Text>
              </View>
            </View>
            <View style={styles.calloutFooter}>
              <Text style={styles.calloutBio}>{match.bio ? (match.bio.length > 30 ? match.bio.substring(0, 30) + '...' : match.bio) : 'No bio provided'}</Text>
              <TouchableOpacity style={styles.calloutButton}>
                <Text style={styles.calloutButtonText}>Chat Now</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Callout>
      </Marker>
    );
  };

  const renderPlaceMarker = (place: typeof PLACES_OF_INTEREST[0]) => (
    <Marker
      key={place.id}
      coordinate={place.coordinates}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.placeMarkerContainer}>
        <Text style={styles.placeMarkerIcon}>{place.icon}</Text>
        <Text style={styles.placeMarkerText}>{place.name}</Text>
        <Text style={styles.placeMarkerType}>{place.type}</Text>
      </View>
    </Marker>
  );

  return (
    <View style={styles.container}>
      {/* Search and Location Header */}
      <Animated.View 
        entering={FadeInDown}
        style={styles.header}
      >
        <View style={styles.searchContainer}>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={() => setIsSearching(true)}
          >
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              {matches.length > 0 ? `${matches.length} Matches Nearby` : 'No Matches Nearby'}
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.ghostButton}
            onPress={() => setShowGhostMode(!showGhostMode)}
          >
            <Ionicons 
              name={showGhostMode ? "eye-off" : "eye"} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7D5BA6" />
          <Text style={styles.loadingText}>Loading matches on map...</Text>
        </View>
      ) : (
        <>
          {/* Main Map */}
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={currentLocation}
            customMapStyle={darkMapStyle}
            showsUserLocation
            showsCompass={false}
            showsMyLocationButton={false}
            rotateEnabled={false}
            showsBuildings={false}
            showsIndoors={false}
            showsPointsOfInterest={false}
            showsTraffic={false}
          >
            {/* Heatmap only if we have matches */}
            {matches.length > 0 && (
              <Heatmap
                points={matches
                  .filter(match => match.parsedLocation)
                  .map(match => ({
                    latitude: match.parsedLocation!.latitude,
                    longitude: match.parsedLocation!.longitude,
                    weight: 1,
                  }))}
                radius={20}
                opacity={0.3}
                gradient={{
                  colors: ['#ffd700', '#ff8c00', '#ff4500'],
                  startPoints: [0, 0.5, 1],
                  colorMapSize: 2000
                }}
              />
            )}
            
            {/* User Markers */}
            {!showGhostMode && matches.map(renderUserMarker)}
            
            {/* Places Markers */}
            {PLACES_OF_INTEREST.map(renderPlaceMarker)}
          </MapView>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <BlurView intensity={20} tint="dark" style={styles.actionButton}>
              <TouchableOpacity 
                style={styles.actionBlur}
                onPress={getUserLocation}
              >
                <Ionicons name="compass" size={24} color="#fff" />
              </TouchableOpacity>
            </BlurView>
            <BlurView intensity={20} tint="dark" style={styles.actionButton}>
              <TouchableOpacity 
                style={styles.actionBlur}
                onPress={() => fetchMatches()}
              >
                <Ionicons name="refresh" size={24} color="#fff" />
              </TouchableOpacity>
            </BlurView>
          </View>

          {/* Bottom Matches Navigation */}
          {matches.length > 0 && (
            <BlurView intensity={30} tint="dark" style={styles.bottomNav}>
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.bottomNavContent}
              >
                {matches.map((match) => (
                  <TouchableOpacity 
                    key={match.userId.toString()}
                    style={styles.userButton}
                    onPress={() => {
                      if (match.parsedLocation) {
                        mapRef.current?.animateToRegion({
                          latitude: match.parsedLocation.latitude,
                          longitude: match.parsedLocation.longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        });
                      }
                    }}
                  >
                    <Image 
                      source={{ uri: match.profile_photo || DEFAULT_PROFILE_IMAGE }}
                      style={styles.userButtonImage}
                      defaultSource={require('@/assets/images/avatar.png')}
                    />
                    <Text style={styles.userButtonName}>{match.username}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </BlurView>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    zIndex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 25,
    padding: 10,
  },
  searchButton: {
    padding: 5,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  temperatureText: {
    color: '#fff',
    fontSize: 16,
  },
  ghostButton: {
    padding: 5,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerImageActive: {
    borderColor: '#00ff00',
  },
  markerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 2,
    backgroundColor: 'rgba(125, 91, 166, 0.8)',
  },
  markerBadgeActive: {
    backgroundColor: '#00ff00',
  },
  markerBadgeInactive: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  markerTime: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  calloutContainer: {
    width: width * 0.7,
    borderRadius: 15,
    overflow: 'hidden',
    padding: 12,
  },
  calloutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  calloutImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10,
  },
  calloutInfo: {
    flex: 1,
  },
  calloutName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  calloutStatus: {
    color: '#fff',
    opacity: 0.8,
    fontSize: 14,
  },
  calloutLocation: {
    color: '#fff',
    opacity: 0.8,
    fontSize: 12,
  },
  calloutFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  calloutBio: {
    color: '#fff',
    fontSize: 12,
    flex: 1,
    marginRight: 10,
  },
  calloutButton: {
    backgroundColor: '#7D5BA6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  calloutButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  placeMarkerContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 10,
  },
  placeMarkerIcon: {
    fontSize: 20,
  },
  placeMarkerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  placeMarkerType: {
    color: '#fff',
    opacity: 0.8,
    fontSize: 10,
  },
  quickActions: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 120 : 100,
    gap: 10,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionBlur: {
    padding: 12,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  bottomNavContent: {
    paddingHorizontal: 8,
  },
  userButton: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  userButtonImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#fff',
  },
  userButtonName: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    zIndex: 2,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
});

const darkMapStyle = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#242f3e' }]
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#746855' }]
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#242f3e' }]
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'geometry',
    stylers: [{ color: '#263c3f' }]
  },
  {
    featureType: 'poi.park',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#6b9a76' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#746855' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#1f2835' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#f3d19c' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }]
  }
];