import React, { useEffect, useState, useRef, useCallback } from 'react';
import MapView, { PROVIDER_GOOGLE, Marker, Callout, Circle, MapTypes } from 'react-native-maps';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Image, Platform, Dimensions, ActivityIndicator, Linking, Modal, SafeAreaView } from 'react-native';
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
  Extrapolate,
  ZoomIn
} from 'react-native-reanimated';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import IMAGES from '@/src/constants/images';

const { width, height } = Dimensions.get('window');

// Set API URL to your local server
const API_URL = 'http://10.0.2.2:5000';

// Default profile image if none provided
const DEFAULT_PROFILE_IMAGE = 'https://static.vecteezy.com/system/resources/thumbnails/009/292/244/small/default-avatar-icon-of-social-media-user-vector.jpg';

// Map styles
const CUSTOM_MAP_STYLE = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#dadada" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#e9edf0" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
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

  // Initial data fetch with error handling
  useEffect(() => {
    console.log("LocationScreen mounted");
    let isMounted = true;

    const initializeLocation = async () => {
      try {
        await getUserLocation();
        if (isMounted) {
          await fetchMatches();
        }
      } catch (error) {
        console.error("Failed to initialize location screen:", error);
        if (isMounted) {
          setError("Failed to initialize map");
          setLoading(false);
        }
      }
    };

    initializeLocation();

    // Cleanup function to prevent state updates after unmount
    return () => {
      console.log("LocationScreen unmounted");
      isMounted = false;
    };
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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerNew}>
          <View>
            <Text style={styles.headerTitle}>Your Location</Text>
            <Text style={styles.headerSubtitle}>Matches Nearby</Text>
          </View>
        </View>

        {/* Map */}
        <View style={styles.mapContainerNew}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFill}
            initialRegion={currentLocation}
            customMapStyle={CUSTOM_MAP_STYLE}
            showsUserLocation
            showsCompass={false}
            mapType={mapType}
            showsScale={false}
            rotateEnabled={true}
            showsTraffic={false}
            showsIndoors={false}
            showsBuildings={false}
            showsPointsOfInterest={false}
          >
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
                <View style={styles.markerContainerNew}>
                  {match.profile_photo ? (
                    <Image
                      source={{ uri: match.profile_photo || DEFAULT_PROFILE_IMAGE }}
                      style={styles.markerImageNew}
                    />
                  ) : (
                    <View style={styles.markerInitialsNew}>
                      <Text style={styles.initialsText}>
                        {match.username ? match.username.charAt(0).toUpperCase() : '?'}
                      </Text>
                    </View>
                  )}
                </View>
              </Marker>
            ))}

            {/* Places Markers */}
            {PLACES_OF_INTEREST.map((place) => (
              <Marker
                key={place.id}
                coordinate={place.coordinates}
              >
                <View style={styles.placeMarkerContainerNew}>
                  <Text style={styles.placeMarkerIconNew}>{place.icon}</Text>
                </View>
              </Marker>
            ))}
          </MapView>
          
       
          {/* Quick Actions Floating Buttons */}
          <View style={styles.quickActionsNew}>
            <TouchableOpacity
              style={styles.actionButtonNew}
              onPress={() => getUserLocation()}
            >
              <Ionicons name="camera-outline" size={22} color="#333" />
            </TouchableOpacity>
          </View>

          {/* Floating Action Menu */}
          <View style={styles.floatingMenu}>
            <TouchableOpacity
              style={styles.floatingMenuItem}
              onPress={handleSOSOpen}
            >
              <View style={[styles.floatingMenuItemIcon, { backgroundColor: '#FF3B30' }]}>
                <Ionicons name="warning-outline" size={20} color="#FFF" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.floatingMenuItem}
              onPress={getUserLocation}
            >
              <View style={styles.floatingMenuItemIcon}>
                <Ionicons name="navigate-outline" size={20} color="#333" />
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.floatingMenuItem}
              onPress={toggleMapType}
            >
              <View style={styles.floatingMenuItemIcon}>
                <Ionicons name="map-outline" size={20} color="#333" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom Tab Bar */}
        <View style={styles.tabBar}>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="home-outline" size={24} color="#8E8E93" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="compass" size={24} color="#007AFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="chatbubbles-outline" size={24} color="#8E8E93" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabItem}>
            <Ionicons name="person-outline" size={24} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Selected Match Card - Keep existing implementation */}
        {selectedMatch && (
          <View style={styles.matchCardNew}>
            <View style={styles.matchCardContentNew}>
              <View style={styles.matchCardHeaderNew}>
                {selectedMatch.profile_photo ? (
                  <Image
                    source={{ uri: selectedMatch.profile_photo || DEFAULT_PROFILE_IMAGE }}
                    style={styles.matchCardImageNew}
                  />
                ) : (
                  <View style={styles.matchCardInitialsNew}>
                    <Text style={styles.initialsTextLarge}>
                      {selectedMatch.username ? selectedMatch.username.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                )}
                <View style={styles.matchCardInfoNew}>
                  <Text style={styles.matchCardNameNew}>{selectedMatch.username}</Text>
                  <Text style={styles.matchCardBioNew} numberOfLines={1}>
                    {selectedMatch.bio || 'No bio provided'}
                  </Text>
                  {selectedMatch.parsedLocation && (
                    <View style={styles.matchCardLocationNew}>
                      <Ionicons name="location-outline" size={14} color="#007AFF" />
                      <Text style={styles.matchCardLocationTextNew}>
                        {selectedMatch.parsedLocation.city || selectedMatch.parsedLocation.state || 'Location not specified'}
                      </Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.matchCardCloseNew}
                  onPress={() => setSelectedMatch(null)}
                >
                  <Ionicons name="close" size={20} color="#8E8E93" />
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.matchCardButtonNew}
                onPress={() => router.push(`/chat/${selectedMatch.userId}`)}
              >
                <Text style={styles.matchCardButtonTextNew}>Message</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* SOS Modal - Keep existing functionality with updated style */}
        <Animated.View style={[styles.sosBottomSheet, sosBottomSheetStyle]}>
          <View style={styles.sosContentNew}>
            <View style={styles.sosHeaderNew}>
              <View style={styles.sosHeaderBar} />
              <Text style={styles.sosTitleNew}>Emergency</Text>
              <TouchableOpacity
                style={styles.sosCloseNew}
                onPress={handleSOSClose}
              >
                <Text style={styles.sosCloseTextNew}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.sosOptionsNew}>
              <TouchableOpacity
                style={styles.sosOptionNew}
                onPress={handleEmergencyCall}
              >
                <View style={[styles.sosOptionIconNew, { backgroundColor: '#FF3B30' }]}>
                  <Ionicons name="call" size={28} color="#FFF" />
                </View>
                <View style={styles.sosOptionInfoNew}>
                  <Text style={styles.sosOptionTitleNew}>Police</Text>
                  <Text style={styles.sosOptionSubtitleNew}>Call 100</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sosOptionNew}
                onPress={handleTrustedContact}
              >
                <View style={[styles.sosOptionIconNew, { backgroundColor: '#007AFF' }]}>
                  <Ionicons name="people" size={28} color="#FFF" />
                </View>
                <View style={styles.sosOptionInfoNew}>
                  <Text style={styles.sosOptionTitleNew}>Trusted Contacts</Text>
                  <Text style={styles.sosOptionSubtitleNew}>Alert your circle</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sosOptionNew}
                onPress={handleMedicalEmergency}
              >
                <View style={[styles.sosOptionIconNew, { backgroundColor: '#34C759' }]}>
                  <Ionicons name="medkit" size={28} color="#FFF" />
                </View>
                <View style={styles.sosOptionInfoNew}>
                  <Text style={styles.sosOptionTitleNew}>Medical</Text>
                  <Text style={styles.sosOptionSubtitleNew}>Call 108</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Loading Overlay - Keep existing implementation */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Finding your location...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerNew: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFF',
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 2,
  },
  mapContainerNew: {
    flex: 1,
    position: 'relative',
  },
  markerContainerNew: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  markerImageNew: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  markerInitialsNew: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  initialsTextLarge: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '600',
  },
  placeMarkerContainerNew: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  placeMarkerIconNew: {
    fontSize: 20,
  },
  locateIndicator: {
    position: 'absolute',
    bottom: 140,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  locateIndicatorDot: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#007AFF',
    borderWidth: 6,
    borderColor: '#FFF',
  },
  locateIndicatorText: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 8,
  },
  locateIndicatorLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsNew: {
    position: 'absolute',
    right: 16,
    bottom: 140,
  },
  actionButtonNew: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  floatingMenu: {
    position: 'absolute',
    right: 16,
    top: 80,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  floatingMenuItem: {
    marginVertical: 8,
  },
  floatingMenuItemIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    height: 50,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchCardNew: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 80,
  },
  matchCardContentNew: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  matchCardHeaderNew: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  matchCardImageNew: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  matchCardInitialsNew: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchCardInfoNew: {
    flex: 1,
    marginLeft: 12,
  },
  matchCardNameNew: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  matchCardBioNew: {
    fontSize: 14,
    color: '#666',
  },
  matchCardLocationNew: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  matchCardLocationTextNew: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  matchCardCloseNew: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchCardButtonNew: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  matchCardButtonTextNew: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sosContentNew: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  sosHeaderNew: {
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  sosHeaderBar: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginBottom: 12,
  },
  sosTitleNew: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  sosCloseNew: {
    position: 'absolute',
    right: 0,
    top: 12,
  },
  sosCloseTextNew: {
    fontSize: 16,
    color: '#007AFF',
  },
  sosOptionsNew: {
    marginTop: 12,
  },
  sosOptionNew: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sosOptionIconNew: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosOptionInfoNew: {
    flex: 1,
    marginLeft: 16,
  },
  sosOptionTitleNew: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  sosOptionSubtitleNew: {
    fontSize: 14,
    color: '#666',
  },
  sosBottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 1000,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
});