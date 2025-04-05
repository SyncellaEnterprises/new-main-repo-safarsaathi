import React, { useEffect, useState, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE, Heatmap, Marker, Callout } from 'react-native-maps';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Image, Platform, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

// Mock user data with Snapchat-like details
const MOCK_USERS = [
  {
    id: '1',
    name: 'Anurag',
    avatar: 'https://picsum.photos/200',
    status: '7h ago',
    location: 'Talao Pali',
    coordinates: {
      latitude: 19.0760,
      longitude: 72.8777,
    },
    isActive: false,
    mood: '🎮 Gaming',
    battery: '57%'
  },
  {
    id: '2',
    name: 'Dhanush',
    avatar: 'https://picsum.photos/201',
    status: '1h ago',
    location: 'Juhu Beach',
    coordinates: {
      latitude: 19.0825,
      longitude: 72.8757,
    },
    isActive: true,
    mood: '🏖️ At Beach',
    battery: '82%'
  },
  // Add more mock users as needed
];

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
  // Add more places
];

export default function LocationScreen() {
  const mapRef = useRef<MapView>(null);
  const [currentLocation, setCurrentLocation] = useState({
    latitude: 19.0760,
    longitude: 72.8777,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [showGhostMode, setShowGhostMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          ...currentLocation,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }
    })();
  }, []);

  const renderUserMarker = (user: typeof MOCK_USERS[0]) => (
    <Marker
      key={user.id}
      coordinate={user.coordinates}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <View style={styles.markerContainer}>
        <Image 
          source={{ uri: user.avatar }}
          style={[
            styles.markerImage,
            user.isActive && styles.markerImageActive
          ]}
        />
        <View style={[
          styles.markerBadge,
          user.isActive ? styles.markerBadgeActive : styles.markerBadgeInactive
        ]}>
          <Text style={styles.markerTime}>
            {user.isActive ? 'now' : user.status}
          </Text>
        </View>
      </View>
      <Callout tooltip>
        <BlurView intensity={30} tint="dark" style={styles.calloutContainer}>
          <View style={styles.calloutHeader}>
            <Image 
              source={{ uri: user.avatar }}
              style={styles.calloutImage}
            />
            <View style={styles.calloutInfo}>
              <Text style={styles.calloutName}>{user.name}</Text>
              <Text style={styles.calloutStatus}>{user.mood}</Text>
              <Text style={styles.calloutLocation}>📍 {user.location}</Text>
            </View>
          </View>
          <View style={styles.calloutFooter}>
            <Text style={styles.calloutBattery}>🔋 {user.battery}</Text>
            <TouchableOpacity style={styles.calloutButton}>
              <Text style={styles.calloutButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </BlurView>
      </Callout>
    </Marker>
  );

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
            <Text style={styles.locationText}>Mumbai</Text>
            <Text style={styles.temperatureText}>25°C</Text>
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
      >
        {/* Heatmap */}
        <Heatmap
          points={MOCK_USERS.map(user => ({
            latitude: user.coordinates.latitude,
            longitude: user.coordinates.longitude,
            weight: user.isActive ? 1 : 0.5,
          }))}
          radius={50}
          opacity={0.3}
          gradient={{
            colors: ['#ffd700', '#ff8c00', '#ff4500'],
            startPoints: [0, 0.5, 1],
            colorMapSize: 2000
          }}
        />
        
        {/* User Markers */}
        {!showGhostMode && MOCK_USERS.map(renderUserMarker)}
        
        {/* Places Markers */}
        {PLACES_OF_INTEREST.map(renderPlaceMarker)}
      </MapView>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <BlurView intensity={20} tint="dark" style={styles.actionButton}>
          <TouchableOpacity style={styles.actionBlur}>
            <Ionicons name="compass" size={24} color="#fff" />
          </TouchableOpacity>
        </BlurView>
        <BlurView intensity={20} tint="dark" style={styles.actionButton}>
          <TouchableOpacity style={styles.actionBlur}>
            <Ionicons name="layers" size={24} color="#fff" />
          </TouchableOpacity>
        </BlurView>
      </View>

      {/* Bottom Navigation */}
      <BlurView intensity={30} tint="dark" style={styles.bottomNav}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.bottomNavContent}
        >
          {MOCK_USERS.map((user) => (
            <TouchableOpacity 
              key={user.id}
              style={styles.userButton}
            >
              <Image 
                source={{ uri: user.avatar }}
                style={styles.userButtonImage}
              />
              <Text style={styles.userButtonName}>{user.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </BlurView>
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
  },
  markerBadgeActive: {
    backgroundColor: '#00ff00',
  },
  markerBadgeInactive: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  markerTime: {
    fontSize: 10,
    color: '#000',
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
  calloutBattery: {
    color: '#fff',
    fontSize: 12,
  },
  calloutButton: {
    backgroundColor: '#00ff00',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  calloutButtonText: {
    color: '#000',
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