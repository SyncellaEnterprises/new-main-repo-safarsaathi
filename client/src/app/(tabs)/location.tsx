import React, { useEffect, useState, useRef, useCallback } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker, Callout, Circle, MapTypes } from 'react-native-maps';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Image, Platform, Dimensions, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown, SlideInUp } from 'react-native-reanimated';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Set API URL to your local server
const API_URL = 'http://10.0.2.2:5000';

// Default profile image if none provided
const DEFAULT_PROFILE_IMAGE = 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg';

// Map styles
const CUSTOM_MAP_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [{"color": "#121212"}]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{"visibility": "off"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#757575"}]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#212121"}]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{"color": "#2e2e2e"}]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#7D5BA6"}]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#bdbdbd"}]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#757575"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{"color": "#151515"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#616161"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#1b1b1b"}]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{"color": "#333333"}]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#8a8a8a"}]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{"color": "#353535"}]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{"color": "#3c3c3c"}]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [{"color": "#4e4e4e"}]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#616161"}]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#757575"}]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{"color": "#070F1A"}]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#3d3d3d"}]
  }
];

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

// Places of interest
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
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);
  const [showGhostMode, setShowGhostMode] = useState(false);
  const [mapType, setMapType] = useState<'standard' | 'satellite'>('standard');

  // Initialize with user's current location
  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        });
        
        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }, 1000);
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

  // Handle match selection
  const handleSelectMatch = (match: Match) => {
    setSelectedMatch(match);
    
    if (match.parsedLocation && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: match.parsedLocation.latitude,
        longitude: match.parsedLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }, 1000);
    }
  };

  // Toggle map type
  const toggleMapType = () => {
    setMapType(prev => prev === 'standard' ? 'satellite' : 'standard');
  };

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
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => handleSelectMatch(match)}
        >
          <LinearGradient
            colors={['#7D5BA6', '#9D7EBD']}
            style={styles.markerGradient}
          >
            <Image 
              source={{ uri: match.profile_photo || DEFAULT_PROFILE_IMAGE }}
              style={styles.markerImage}
              defaultSource={require('@/assets/images/avatar.png')}
            />
          </LinearGradient>
          <View style={styles.markerBadge}>
            <Text style={styles.markerTime}>
              {match.username}
            </Text>
          </View>
        </TouchableOpacity>
      </Marker>
    );
  };

  // Render a place marker
  const renderPlaceMarker = (place: typeof PLACES_OF_INTEREST[0]) => (
    <Marker
      key={place.id}
      coordinate={place.coordinates}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.placeMarkerContainer}>
        <Text style={styles.placeMarkerIcon}>{place.icon}</Text>
        <Text style={styles.placeMarkerText}>{place.name}</Text>
      </View>
    </Marker>
  );

  return (
    <View style={styles.container}>
      {/* Fancy Header */}
      <Animated.View 
        entering={FadeInDown.duration(800).delay(200)}
        style={styles.header}
      >
        <BlurView intensity={20} tint="dark" style={styles.searchContainer}>
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
        </BlurView>
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7D5BA6" />
          <Text style={styles.loadingText}>Loading matches on map...</Text>
        </View>
      ) : (
        <>
          {/* Custom Styled Map */}
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={currentLocation}
            customMapStyle={CUSTOM_MAP_STYLE}
            showsUserLocation
            showsCompass={false}
            mapType={mapType}
            showsScale={false}
            rotateEnabled={false}
            showsTraffic={false}
            showsIndoors={false}
            showsBuildings={false}
            showsPointsOfInterest={false}
          >
            {/* Location Pulse Effect for Current Location */}
            <Circle
              center={{
                latitude: currentLocation.latitude,
                longitude: currentLocation.longitude,
              }}
              radius={500}
              fillColor="rgba(125, 91, 166, 0.2)"
              strokeColor="rgba(125, 91, 166, 0.5)"
              strokeWidth={1}
            />
            
            {/* Match Markers */}
            {!showGhostMode && matches.map(renderUserMarker)}
            
            {/* Places of Interest */}
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
            <BlurView intensity={20} tint="dark" style={styles.actionButton}>
              <TouchableOpacity 
                style={styles.actionBlur}
                onPress={toggleMapType}
              >
                <MaterialCommunityIcons name={mapType === 'standard' ? "satellite-variant" : "map"} size={24} color="#fff" />
              </TouchableOpacity>
            </BlurView>
          </View>

          {/* Selected Match Info */}
          {selectedMatch && (
            <Animated.View
              entering={SlideInUp.duration(500)}
              style={styles.matchInfoCardContainer}
            >
              <BlurView intensity={30} tint="dark" style={styles.matchInfoCard}>
                <View style={styles.matchInfoHeader}>
                  <Image 
                    source={{ uri: selectedMatch.profile_photo || DEFAULT_PROFILE_IMAGE }}
                    style={styles.matchInfoImage}
                    defaultSource={require('@/assets/images/avatar.png')}
                  />
                  <View style={styles.matchInfoDetails}>
                    <Text style={styles.matchInfoName}>{selectedMatch.username}</Text>
                    <Text style={styles.matchInfoInterests}>{selectedMatch.interests}</Text>
                    {selectedMatch.parsedLocation && (
                      <Text style={styles.matchInfoLocation}>
                        📍 {selectedMatch.parsedLocation.city || selectedMatch.parsedLocation.state || 'Location not specified'}
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity 
                    style={styles.matchInfoClose}
                    onPress={() => setSelectedMatch(null)}
                  >
                    <Ionicons name="close" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.matchInfoBio}>{selectedMatch.bio || 'No bio provided'}</Text>
                <LinearGradient
                  colors={['#7D5BA6', '#9D7EBD']}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.matchInfoButton}
                >
                  <TouchableOpacity 
                    onPress={() => router.push(`/chat/${selectedMatch.userId}`)}
                    style={styles.matchInfoButtonInner}
                  >
                    <Text style={styles.matchInfoButtonText}>Start Chatting</Text>
                    <Ionicons name="chatbubble" size={18} color="#fff" style={styles.matchInfoButtonIcon} />
                  </TouchableOpacity>
                </LinearGradient>
              </BlurView>
            </Animated.View>
          )}

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
                    style={[
                      styles.userButton,
                      selectedMatch?.userId === match.userId && styles.selectedUserButton
                    ]}
                    onPress={() => handleSelectMatch(match)}
                  >
                    <LinearGradient
                      colors={['#7D5BA6', '#9D7EBD']}
                      style={[
                        styles.userButtonBorder,
                        selectedMatch?.userId === match.userId && styles.selectedUserButtonBorder
                      ]}
                    >
                      <Image 
                        source={{ uri: match.profile_photo || DEFAULT_PROFILE_IMAGE }}
                        style={styles.userButtonImage}
                        defaultSource={require('@/assets/images/avatar.png')}
                      />
                    </LinearGradient>
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
    backgroundColor: '#1D1B26',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  header: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 16,
    right: 16,
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(125, 91, 166, 0.3)',
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat-Bold',
  },
  ghostButton: {
    padding: 5,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  markerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(125, 91, 166, 0.5)',
  },
  markerTime: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
    fontFamily: 'Montserrat-Medium',
  },
  placeMarkerContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  placeMarkerIcon: {
    fontSize: 20,
  },
  placeMarkerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Montserrat-Medium',
  },
  placeMarkerType: {
    color: '#fff',
    opacity: 0.8,
    fontSize: 10,
    fontFamily: 'Montserrat',
  },
  quickActions: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 120 : 100,
    gap: 10,
  },
  actionButton: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(125, 91, 166, 0.3)',
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(125, 91, 166, 0.3)',
  },
  bottomNavContent: {
    paddingHorizontal: 8,
    gap: 16,
  },
  userButton: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  selectedUserButton: {
    transform: [{scale: 1.1}],
  },
  userButtonBorder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedUserButtonBorder: {
    shadowColor: '#7D5BA6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
  },
  userButtonImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  userButtonName: {
    color: '#fff',
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Montserrat-Medium',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 27, 38, 0.7)',
    zIndex: 2,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
    fontFamily: 'Montserrat',
  },
  matchInfoCardContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 100,
    zIndex: 5,
  },
  matchInfoCard: {
    padding: 16,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(125, 91, 166, 0.3)',
  },
  matchInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  matchInfoImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  matchInfoDetails: {
    flex: 1,
  },
  matchInfoName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'YoungSerif-Regular',
  },
  matchInfoInterests: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    fontFamily: 'Montserrat',
  },
  matchInfoLocation: {
    color: '#fff',
    fontSize: 12,
    opacity: 0.7,
    marginTop: 4,
    fontFamily: 'Montserrat-Light',
  },
  matchInfoClose: {
    padding: 8,
  },
  matchInfoBio: {
    color: '#fff',
    fontSize: 14,
    marginVertical: 12,
    lineHeight: 20,
    fontFamily: 'Montserrat',
  },
  matchInfoButton: {
    borderRadius: 20,
    marginTop: 8,
  },
  matchInfoButtonInner: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  matchInfoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Montserrat-Bold',
  },
  matchInfoButtonIcon: {
    marginLeft: 8,
  },
});