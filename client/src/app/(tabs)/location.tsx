import React, { useEffect, useState, useRef } from 'react';
import MapView, { PROVIDER_GOOGLE, Heatmap, Marker, Callout } from 'react-native-maps';
import { StyleSheet, View, ScrollView, TouchableOpacity, Text, Image, Platform, Dimensions } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');

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
  const [matches, setMatches] = useState<any[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        
        // Get current user location
        const userResponse = await axios.get('http://localhost:5000/api/users/me', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        console.log(userResponse.data.user);
        console.log(userResponse.data.user.location);
        console.log(userResponse.data.user.location.latitude);
        console.log(userResponse.data.user.location.longitude);
        // Parse user location
        const userLocation = JSON.parse(userResponse.data.user.location);
        setUserData({
          ...userResponse.data.user,
          location: userLocation  // Store parsed location in state
        });
        
        // Update map region
        setCurrentLocation(prev => ({
          ...prev,
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
        }));
        console.log(currentLocation);

        // Get matches
        const matchesResponse = await axios.post('http://localhost:5000/api/matches', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setMatches(matchesResponse.data.matches.map((match: any) => ({
          ...match,
          location: JSON.parse(match.matched_location)
        })));
        console.log(matches);
        console.log(matchesResponse.data.matches);

      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderUserMarker = (match: any) => (
    <Marker
      key={match.match_id}
      coordinate={{
        latitude: match.location.latitude,
        longitude: match.location.longitude
      }}
    >
      <View style={styles.markerContainer}>
        <Text style={styles.markerText}>{match.matched_username}</Text>
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
              {userData?.location?.city || 'Loading...'}
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
          points={matches.map(match => ({
            latitude: match.location.latitude,
            longitude: match.location.longitude,
            weight: 1
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
        {!showGhostMode && matches.map(renderUserMarker)}
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
          {matches.map((match) => (
            <TouchableOpacity 
              key={match.match_id}
              style={styles.userButton}
            >
              <Image 
                source={{ uri: match.profile_photo || 'https://picsum.photos/200' }}
                style={styles.userButtonImage}
              />
              <Text style={styles.userButtonName}>{match.matched_username}</Text>
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
  ghostButton: {
    padding: 5,
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    padding: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 4
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
