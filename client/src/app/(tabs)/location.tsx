import React, { useEffect, useState, useRef, useCallback } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker, Callout, Circle, MapTypes } from 'react-native-maps';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Image, Platform, Dimensions, ActivityIndicator, Linking, Modal } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeIn, 
  FadeInDown, 
  SlideInUp, 
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';

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
  const [showSOSModal, setShowSOSModal] = useState(false);

  // Add new animated values
  const mapScale = useSharedValue(1);
  const mapOpacity = useSharedValue(1);
  const bottomSheetTranslateY = useSharedValue(height);
  const headerHeight = useSharedValue(Platform.OS === 'ios' ? 120 : 100);
  const sosBottomSheet = useSharedValue(height);

  // Animated styles
  const mapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: mapScale.value }],
    opacity: mapOpacity.value
  }));

  const headerStyle = useAnimatedStyle(() => ({
    height: headerHeight.value,
    opacity: interpolate(
      headerHeight.value,
      [90, 120],
      [0.8, 1],
      Extrapolate.CLAMP
    )
  }));

  const bottomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomSheetTranslateY.value }]
  }));

  const sosBottomSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sosBottomSheet.value }]
  }));

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

  // Handle emergency call
  const handleEmergencyCall = async () => {
    const phoneNumber = '100';
    const currentLocationText = `Current Location: ${currentLocation.latitude}, ${currentLocation.longitude}`;
    
    try {
      const url = Platform.select({
        ios: `tel:${phoneNumber}`,
        android: `tel:${phoneNumber}`
      });
      
      if (url) {
        await Linking.openURL(url);
        console.log('Dialing emergency number with location:', currentLocationText);
      }
    } catch (error) {
      console.error('Error making emergency call:', error);
    }
  };

  // Handle trusted contact
  const handleTrustedContact = () => {
    console.log('Trusted contact button clicked');
    setShowSOSModal(false);
  };

  // Handle medical emergency
  const handleMedicalEmergency = async () => {
    const phoneNumber = '108'; // Common medical emergency number in India
    
    try {
      const url = Platform.select({
        ios: `tel:${phoneNumber}`,
        android: `tel:${phoneNumber}`
      });
      
      if (url) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Error making medical emergency call:', error);
    }
  };

  // Modify the handleSOSOpen function
  const handleSOSOpen = () => {
    sosBottomSheet.value = withSpring(0, {
      damping: 20,
      stiffness: 90
    });
  };

  // Add handleSOSClose function
  const handleSOSClose = () => {
    sosBottomSheet.value = withSpring(height, {
      damping: 20,
      stiffness: 90
    });
  };

  return (
    <View style={styles.container}>
      {/* Animated Map Container */}
      <Animated.View style={[styles.mapContainer, mapStyle]}>
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
          {/* Location Pulse Effect */}
          <MotiView
            from={{ opacity: 0.4, scale: 1 }}
            animate={{ opacity: 0, scale: 4 }}
            transition={{
              type: 'timing',
              duration: 2000,
              loop: true,
            }}
            style={styles.pulseCircle}
          >
            <Circle
              center={currentLocation}
              radius={500}
              fillColor="rgba(69, 183, 209, 0.2)"
              strokeColor="rgba(69, 183, 209, 0.5)"
              strokeWidth={1}
            />
          </MotiView>

          {/* Match Markers */}
          {!showGhostMode && matches.map((match) => (
            <Marker
              key={match.userId.toString()}
              coordinate={{
                latitude: match.parsedLocation?.latitude || currentLocation.latitude,
                longitude: match.parsedLocation?.longitude || currentLocation.longitude
              }}
              onPress={() => handleSelectMatch(match)}
            >
              <Animated.View
                entering={FadeInDown.delay(200).springify()}
                style={styles.markerContainer}
              >
                <LinearGradient
                  colors={['#45B7D1', '#4ECDC4']}
                  style={styles.markerGradient}
                >
                  <Image
                    source={{ uri: match.profile_photo || DEFAULT_PROFILE_IMAGE }}
                    style={styles.markerImage}
                  />
                </LinearGradient>
                <BlurView intensity={20} tint="dark" style={styles.markerLabel}>
                  <Text style={styles.markerName}>{match.username}</Text>
                </BlurView>
              </Animated.View>
            </Marker>
          ))}

          {/* Places Markers */}
          {PLACES_OF_INTEREST.map((place) => (
            <Marker
              key={place.id}
              coordinate={place.coordinates}
            >
              <Animated.View
                entering={FadeInDown.delay(300).springify()}
                style={styles.placeMarkerContainer}
              >
                <LinearGradient
                  colors={['#FF6B6B', '#FF8E8E']}
                  style={styles.placeMarkerGradient}
                >
                  <Text style={styles.placeMarkerIcon}>{place.icon}</Text>
                </LinearGradient>
                <BlurView intensity={20} tint="dark" style={styles.placeMarkerLabel}>
                  <Text style={styles.placeMarkerText}>{place.name}</Text>
                  <Text style={styles.placeMarkerType}>{place.type}</Text>
                </BlurView>
              </Animated.View>
            </Marker>
          ))}
        </MapView>
      </Animated.View>

      {/* Modern Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <BlurView intensity={20} tint="dark" style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>Your Location</Text>
              <Text style={styles.locationSubtitle}>
                {matches.length > 0 ? `${matches.length} Matches Nearby` : 'No Matches Nearby'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.ghostButton}
              onPress={() => setShowGhostMode(!showGhostMode)}
            >
              <LinearGradient
                colors={showGhostMode ? ['#FF6B6B', '#FF8E8E'] : ['#45B7D1', '#4ECDC4']}
                style={styles.ghostButtonGradient}
              >
                <Ionicons
                  name={showGhostMode ? "eye-off" : "eye"}
                  size={24}
                  color="#fff"
                />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleSOSOpen}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8E8E']}
            style={styles.actionButtonGradient}
          >
            <Feather name="alert-circle" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={getUserLocation}
        >
          <LinearGradient
            colors={['#45B7D1', '#4ECDC4']}
            style={styles.actionButtonGradient}
          >
            <Feather name="navigation" size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={toggleMapType}
        >
          <LinearGradient
            colors={['#45B7D1', '#4ECDC4']}
            style={styles.actionButtonGradient}
          >
            <Feather name={mapType === 'standard' ? "map" : "map-pin"} size={24} color="#fff" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Selected Match Card */}
      {selectedMatch && (
        <Animated.View
          entering={SlideInUp.springify()}
          style={styles.matchCard}
        >
          <BlurView intensity={20} tint="dark" style={styles.matchCardContent}>
            <View style={styles.matchCardHeader}>
              <Image
                source={{ uri: selectedMatch.profile_photo || DEFAULT_PROFILE_IMAGE }}
                style={styles.matchCardImage}
              />
              <View style={styles.matchCardInfo}>
                <Text style={styles.matchCardName}>{selectedMatch.username}</Text>
                <Text style={styles.matchCardBio}>{selectedMatch.bio || 'No bio provided'}</Text>
                {selectedMatch.parsedLocation && (
                  <View style={styles.matchCardLocation}>
                    <Feather name="map-pin" size={14} color="#45B7D1" />
                    <Text style={styles.matchCardLocationText}>
                      {selectedMatch.parsedLocation.city || selectedMatch.parsedLocation.state || 'Location not specified'}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                style={styles.matchCardClose}
                onPress={() => setSelectedMatch(null)}
              >
                <Feather name="x" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.matchCardButton}
              onPress={() => router.push(`/chat/${selectedMatch.userId}`)}
            >
              <LinearGradient
                colors={['#45B7D1', '#4ECDC4']}
                style={styles.matchCardButtonGradient}
              >
                <Text style={styles.matchCardButtonText}>Start Chat</Text>
                <Feather name="message-circle" size={20} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </BlurView>
        </Animated.View>
      )}

      {/* Replace the Modal with Animated Bottom Sheet */}
      <Animated.View style={[styles.sosBottomSheet, sosBottomSheetStyle]}>
        <BlurView intensity={20} tint="dark" style={styles.sosContent}>
          <View style={styles.sosHeader}>
            <View style={styles.sosHeaderLeft}>
              <View style={styles.sosHeaderIcon}>
                <Feather name="alert-triangle" size={24} color="#FF6B6B" />
              </View>
              <Text style={styles.sosTitle}>Emergency SOS</Text>
            </View>
            <TouchableOpacity
              style={styles.sosClose}
              onPress={handleSOSClose}
            >
              <Feather name="x" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.sosOptions}>
            <TouchableOpacity
              style={styles.sosOption}
              onPress={handleEmergencyCall}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E8E']}
                style={styles.sosOptionGradient}
              >
                <Feather name="phone-call" size={32} color="#fff" />
                <View style={styles.sosOptionInfo}>
                  <Text style={styles.sosOptionTitle}>Police</Text>
                  <Text style={styles.sosOptionSubtitle}>Call 100</Text>
                </View>
                <Feather name="chevron-right" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosOption}
              onPress={handleTrustedContact}
            >
              <LinearGradient
                colors={['#45B7D1', '#4ECDC4']}
                style={styles.sosOptionGradient}
              >
                <Feather name="users" size={32} color="#fff" />
                <View style={styles.sosOptionInfo}>
                  <Text style={styles.sosOptionTitle}>Trusted Contacts</Text>
                  <Text style={styles.sosOptionSubtitle}>Alert your circle</Text>
                </View>
                <Feather name="chevron-right" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosOption}
              onPress={handleMedicalEmergency}
            >
              <LinearGradient
                colors={['#4CAF50', '#66BB6A']}
                style={styles.sosOptionGradient}
              >
                <Feather name="plus-circle" size={32} color="#fff" />
                <View style={styles.sosOptionInfo}>
                  <Text style={styles.sosOptionTitle}>Medical</Text>
                  <Text style={styles.sosOptionSubtitle}>Call 108</Text>
                </View>
                <Feather name="chevron-right" size={24} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Animated.View>

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
                  colors={['#45B7D1', '#4ECDC4']}
                  style={[
                    styles.userButtonBorder,
                    selectedMatch?.userId === match.userId && styles.selectedUserButtonBorder
                  ]}
                >
                  <Image 
                    source={{ uri: match.profile_photo || DEFAULT_PROFILE_IMAGE }}
                    style={styles.userButtonImage}
                  />
                </LinearGradient>
                <Text style={styles.userButtonName}>{match.username}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </BlurView>
      )}

      {/* Loading Overlay */}
      {loading && (
        <BlurView intensity={20} tint="dark" style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#45B7D1" />
          <Text style={styles.loadingText}>Loading matches...</Text>
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  headerContent: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'YoungSerif-Regular',
  },
  locationSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
    fontFamily: 'Montserrat',
  },
  ghostButton: {
    marginLeft: 16,
  },
  ghostButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActions: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 120 : 100,
    gap: 16,
  },
  actionButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionButtonGradient: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  markerName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  placeMarkerContainer: {
    alignItems: 'center',
  },
  placeMarkerGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeMarkerIcon: {
    fontSize: 20,
  },
  placeMarkerLabel: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  placeMarkerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Montserrat',
  },
  placeMarkerType: {
    color: '#fff',
    opacity: 0.7,
    fontSize: 10,
    fontFamily: 'Montserrat',
  },
  matchCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: Platform.OS === 'ios' ? 100 : 80,
  },
  matchCardContent: {
    borderRadius: 20,
    overflow: 'hidden',
    padding: 16,
  },
  matchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchCardImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#45B7D1',
  },
  matchCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  matchCardName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'YoungSerif-Regular',
  },
  matchCardBio: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    marginTop: 4,
    fontFamily: 'Montserrat',
  },
  matchCardLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  matchCardLocationText: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.7,
    marginLeft: 4,
    fontFamily: 'Montserrat',
  },
  matchCardClose: {
    padding: 8,
  },
  matchCardButton: {
    marginTop: 16,
  },
  matchCardButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
  },
  matchCardButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    fontFamily: 'Montserrat-Bold',
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
    padding: 2,
  },
  selectedUserButtonBorder: {
    shadowColor: '#45B7D1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 5,
    elevation: 8,
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
    fontFamily: 'Montserrat',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  sosBottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  sosContent: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 44 : 20,
    marginBottom: Platform.OS === 'ios' ? 0 : 70, // Space for bottom navigation
  },
  sosHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sosHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sosHeaderIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sosTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: 'YoungSerif-Regular',
  },
  sosClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosOptions: {
    gap: 12,
  },
  sosOption: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8,
  },
  sosOptionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingHorizontal: 20,
  },
  sosOptionInfo: {
    flex: 1,
    marginLeft: 16,
  },
  sosOptionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Montserrat-Bold',
  },
  sosOptionSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    fontFamily: 'Montserrat',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 12,
    fontFamily: 'Montserrat',
  },
  pulseCircle: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
  },
});