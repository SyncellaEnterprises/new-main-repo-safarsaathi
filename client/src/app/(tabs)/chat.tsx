import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, Image, RefreshControl, ActivityIndicator, TextInput, Modal, ScrollView, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import TabHeader from '@/src/components/shared/TabHeader';
import { SearchBar } from '@/src/components/shared/SearchBar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolate
} from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/src/context/AuthContext';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import DateTimePicker from '@react-native-community/datetimepicker';

// Set API URL to your local server (same as in explore.tsx)
const API_URL = 'http://10.0.2.2:5000';

// Default profile image if none provided
const DEFAULT_PROFILE_IMAGE = 'https://via.placeholder.com/400x400?text=No+Profile+Image';

// Match interface from API
interface Match {
  username: string;
  userId: number;
  email: string;
  interests: string;
  matchDate: string;
  bio: string;
  profile_photo?: string | null;
}

// Add new message status interface
interface MessageStatus {
  sent: boolean;
  delivered: boolean;
  read: boolean;
  timestamp: string;
}

// Chat preview interface
interface ChatPreview {
  id: string;
  name: string;
  image: string;
  lastMessage: string;
  last_active: string;
  unreadCount: number;
  type: 'match' | 'group';
  isOnline: boolean;
  lastMessageType?: 'text' | 'image' | 'audio' | 'document';
  match_data?: Match;
  group_data?: TravelGroup;
  messageStatus?: MessageStatus;
  typing?: boolean;
}

// Group creation form interface
interface GroupForm {
  name: string;
  description: string;
  destination: string;
  startDate: string;
  endDate: string;
  selectedMembers: number[];
}

// Interface for group data
interface TravelGroup {
  group_id: number;
  name: string;
  description: string | null;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  created_by: number;
  created_at: string;
  is_active: boolean;
  is_admin: boolean;
  member_count: number;
  last_activity: string | null;
  members?: GroupMember[];
}

interface GroupMember {
  user_id: number;
  username: string;
  profile_photo: string | null;
  is_admin: boolean;
  joined_at: string;
}

// Add ProfileInitials component for avatar fallbacks
const ProfileInitials = ({ name, size }: { name: string; size: number }) => {
  const initial = name && name.length > 0 ? name.charAt(0).toUpperCase() : '?';
  
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Text style={{
        color: 'white',
        fontSize: size / 2.5,
        fontWeight: 'bold',
      }}>
        {initial}
      </Text>
    </View>
  );
};

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<Match[]>([]);
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [travelGroups, setTravelGroups] = useState<TravelGroup[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Group creation modal states
  const [isGroupModalVisible, setIsGroupModalVisible] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupForm, setGroupForm] = useState<GroupForm>({
    name: '',
    description: '',
    destination: '',
    startDate: '',
    endDate: '',
    selectedMembers: []
  });
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  // Add animation values
  const scrollY = useSharedValue(0);
  const headerHeight = useSharedValue(200);

  // Animated styles for the header
  const headerStyle = useAnimatedStyle(() => {
    const height = interpolate(
      scrollY.value,
      [0, 100],
      [headerHeight.value, 120],
      Extrapolate.CLAMP
    );

    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.9],
      Extrapolate.CLAMP
    );

    return {
      height,
      opacity,
    };
  });

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
      console.log('Fetching matches...');
      const response = await axios.get(`${API_URL}/api/matches/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Matches response:', response.data);

      if (response.data.matches) {
        setMatches(response.data.matches);
        
        // Transform matches to chat previews
        const chatPreviews = response.data.matches.map((match: Match) => ({
          id: match.userId.toString(),
          name: match.username,
          image: match.profile_photo || DEFAULT_PROFILE_IMAGE,
          lastMessage: "Tap to start chatting!",
          last_active: match.matchDate,
          unreadCount: 0,
          type: 'match' as const,
          isOnline: false,
          match_data: match
        }));
        
        // We'll combine regular chats and group chats later
        setChats(chatPreviews);
        setError(null);
      } else {
        setMatches([]);
        setChats([]);
        setError('No matches found');
      }
    } catch (error: any) {
      console.error('Error fetching matches:', error);
      setError(error.message || 'Failed to fetch matches');
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load matches'
      });
    } finally {
      // Don't set loading to false yet, wait for groups to load too
      fetchTravelGroups();
    }
  }, []);

  // Fetch travel groups
  const fetchTravelGroups = useCallback(async () => {
    try {
      // Get JWT token
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      // Make API request to get travel groups
      console.log('Fetching travel groups...');
      const response = await axios.get(`${API_URL}/api/groups`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Travel groups response:', response.data);

      if (response.data.success && response.data.groups) {
        const groups = response.data.groups;
        setTravelGroups(groups);
        
        // Transform groups to chat previews
        const groupChatPreviews = groups.map((group: TravelGroup) => ({
          id: `group_${group.group_id}`,
          name: group.name,
          image: 'https://via.placeholder.com/400x400?text=G', // Placeholder for group image
          lastMessage: group.last_activity ? "Recent activity" : "New group created",
          last_active: group.last_activity || group.created_at,
          unreadCount: 0, // We would need to implement unread count for groups
          type: 'group' as const,
          isOnline: true, // Groups are always considered "online"
          group_data: group
        }));
        
        // Combine regular chats and group chats
        setChats(prevChats => [...prevChats, ...groupChatPreviews]);
      }
    } catch (error: any) {
      console.error('Error fetching travel groups:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load travel groups'
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch of matches and groups
  useEffect(() => {
    fetchMatches();
    // fetchTravelGroups is called from within fetchMatches
  }, []);

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMatches();
    setRefreshing(false);
  }, [fetchMatches]);

  // Format date display
  const getTimeDisplay = (timestamp: string) => {
    try {
      const messageDate = new Date(timestamp);
      const today = new Date();
      
      if (messageDate.toDateString() === today.toDateString()) {
        // If message is from today, show time
        return format(messageDate, 'HH:mm');
      } else if (
        messageDate.getDate() === today.getDate() - 1 && 
        messageDate.getMonth() === today.getMonth() && 
        messageDate.getFullYear() === today.getFullYear()
      ) {
        // If message is from yesterday
        return 'Yesterday';
      } else if (today.getTime() - messageDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
        // If message is from this week
        return format(messageDate, 'EEE');
      } else {
        // Otherwise show date
        return format(messageDate, 'dd/MM');
      }
    } catch (e) {
      // If date parsing fails, return a fallback
      return 'New';
    }
  };

  // Render message preview
  const renderMessagePreview = (content: string, type?: string) => {
    if (type === 'image') {
      return (
        <View className="flex-row items-center">
          <Ionicons name="image-outline" size={14} color="#9CA3AF" />
          <Text className="text-neutral-dark ml-1 font-montserrat text-xs">Photo</Text>
        </View>
      );
    } else if (type === 'audio') {
      return (
        <View className="flex-row items-center">
          <Ionicons name="mic-outline" size={14} color="#9CA3AF" />
          <Text className="text-neutral-dark ml-1 font-montserrat text-xs">Voice message</Text>
        </View>
      );
    } else {
      return (
        <Text 
          numberOfLines={1} 
          className={`text-sm font-montserrat ${
            content.includes("@") ? "text-primary" : "text-neutral-dark"
          }`}
        >
          {content}
        </Text>
      );
    }
  };

  // Toggle match selection for group
  const toggleMatchSelection = (userId: number) => {
    setGroupForm(prev => {
      const isSelected = prev.selectedMembers.includes(userId);
      
      if (isSelected) {
        return {
          ...prev,
          selectedMembers: prev.selectedMembers.filter(id => id !== userId)
        };
      } else {
        return {
          ...prev,
          selectedMembers: [...prev.selectedMembers, userId]
        };
      }
    });
  };

  // Handle group creation
  const handleCreateGroup = async () => {
    try {
      // Format data in the structure expected by the API
      const formattedData = {
        name: groupForm.name,
        description: groupForm.description,
        destination: groupForm.destination,
        startDate: groupForm.startDate,
        endDate: groupForm.endDate,
        selectedMembers: groupForm.selectedMembers,
      };

      console.log('Creating group with data:', JSON.stringify(formattedData));

      // Get JWT token
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      // Make API call to create group
      axios.post(
        'http://10.0.2.2:5000/api/groups', 
        formattedData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      .then(response => {
        console.log('Group created successfully:', response.data);
        // Reset form and close modal
        setGroupForm({
          name: '',
          description: '',
          destination: '',
          startDate: '',
          endDate: '',
          selectedMembers: [],
        });
        setIsGroupModalVisible(false);
        
        // Refresh the chat list
        fetchMatches();
        
        // Show success toast
        Toast.show({
          type: 'success',
          text1: 'Group Created',
          text2: 'Your travel group has been created successfully',
        });
      })
      .catch(error => {
        console.error('Error creating group:', error.response?.data || error.message);
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: error.response?.data?.error || 'Failed to create group',
        });
      });
    } catch (error) {
      console.error('Exception creating group:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'An unexpected error occurred',
      });
    }
  };

  // Handle chat item press
  const handleChatPress = (item: ChatPreview) => {
    if (item.type === 'match') {
      // Navigate to regular chat detail
      router.push(`/chat/${item.id}`);
    } else if (item.type === 'group') {
      // Extract group_id from the id (format: group_123)
      const groupId = item.id.replace('group_', '');
      // Navigate to group chat detail screen using path parameter
      router.push(`/group-chat/${groupId}`);
    }
  };

  // Handle date changes
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowStartDatePicker(Platform.OS === 'ios');
    setGroupForm({
      ...groupForm,
      startDate: currentDate.toISOString().split('T')[0]
    });
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    const currentDate = selectedDate || new Date();
    setShowEndDatePicker(Platform.OS === 'ios');
    setGroupForm({
      ...groupForm,
      endDate: currentDate.toISOString().split('T')[0]
    });
  };

  // Format date for display
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    try {
      return format(parseISO(dateString), 'dd/MM/yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Render chat item
  const renderChatItem = ({ item }: { item: ChatPreview }) => (
    <Animated.View entering={FadeInDown.delay(parseInt(item.id.replace(/\D/g, '')) * 100)}>
      <TouchableOpacity
        onPress={() => handleChatPress(item)}
        className="flex-row items-center px-4 py-3.5 active:bg-neutral-medium/10"
      >
        <View className="relative">
          {item.type === 'group' ? (
            <View className="w-14 h-14 rounded-full bg-blue-500 items-center justify-center">
              <Ionicons name="people" size={24} color="#fff" />
              {item.group_data && (
                <View className="absolute -bottom-1 -right-1 bg-gray-100 rounded-full min-w-5 h-5 items-center justify-center px-1">
                  <Text className="text-xs text-gray-800 font-bold">
                    {item.group_data.member_count}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            item.image && item.image !== DEFAULT_PROFILE_IMAGE ? (
              <Image
                source={{ uri: item.image }}
                className="w-14 h-14 rounded-full"
              />
            ) : (
              <ProfileInitials name={item.name} size={56} />
            )
          )}
        </View>

        <View className="flex-1 ml-3 border-b border-neutral-medium/30 pb-3.5">
          <View className="flex-row items-center justify-between">
            <Text className={`text-base ${item.unreadCount > 0 ? 'font-montserratBold text-neutral-darkest' : 'font-montserratMedium text-neutral-dark'}`}>
              {item.name}
            </Text>
            <Text className={`text-xs ${item.unreadCount > 0 ? 'text-primary font-montserratBold' : 'text-neutral-dark font-montserrat'}`}>
              {getTimeDisplay(item.last_active)}
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-1 mr-3">
              {item.type === 'group' && item.group_data?.destination && (
                <Text className="text-xs text-secondary font-montserratMedium mb-1">
                  📍 {item.group_data.destination}
                </Text>
              )}
              <View className="flex-row items-center">
                {item.messageStatus?.read && (
                  <Ionicons name="checkmark-done" size={16} color="#3D90E3" className="mr-1" />
                )}
                {item.messageStatus?.delivered && !item.messageStatus?.read && (
                  <Ionicons name="checkmark-done" size={16} color="#9CA3AF" className="mr-1" />
                )}
                {item.messageStatus?.sent && !item.messageStatus?.delivered && (
                  <Ionicons name="checkmark" size={16} color="#9CA3AF" className="mr-1" />
                )}
                {item.typing ? (
                  <View className="flex-row items-center">
                    <Ionicons name="pencil" size={16} color="#FF4D6D" />
                    <Text className="text-primary text-sm font-montserratMedium ml-1">typing...</Text>
                  </View>
                ) : (
                  renderMessagePreview(item.lastMessage, item.lastMessageType)
                )}
              </View>
            </View>
            
            {item.unreadCount > 0 && (
              <View className="bg-primary rounded-full min-w-5 h-5 items-center justify-center px-1.5">
                <Text className="text-neutral-lightest text-xs font-montserratBold">
                  {item.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  // Empty state component
  const renderEmptyComponent = () => (
    <View className="flex-1 items-center justify-center py-20">
      <LinearGradient
        colors={['rgba(255,77,109,0.1)', 'rgba(61,144,227,0.1)']}
        className="w-20 h-20 rounded-full items-center justify-center mb-4"
      >
        <Ionicons name="chatbubbles-outline" size={40} color="#FF4D6D" />
      </LinearGradient>
      <Text className="text-lg text-center text-neutral-darkest font-youngSerif mb-2">
        No Conversations Yet
      </Text>
      <Text className="text-center text-neutral-dark font-montserrat mb-6 px-8">
        {error || "Start connecting with other travelers and join travel groups to begin your journey!"}
      </Text>
      <View className="flex-row gap-3">
        <TouchableOpacity 
          onPress={() => router.push("/(tabs)/explore")}
          className="bg-gradient-romance px-6 py-3 rounded-xl flex-row items-center"
        >
          <Ionicons name="search" size={18} color="white" />
          <Text className="text-white font-montserratBold ml-2">Find Matches</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setIsGroupModalVisible(true)}
          className="bg-gradient-travel px-6 py-3 rounded-xl flex-row items-center"
        >
          <Ionicons name="people" size={18} color="white" />
          <Text className="text-white font-montserratBold ml-2">Create Group</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Filter chats based on search query
  const filteredChats = chats.filter(chat => {
    if (chat.type === 'match') {
      return (
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chat.match_data?.interests && 
          chat.match_data.interests.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (chat.match_data?.bio && 
          chat.match_data.bio.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    } else if (chat.type === 'group') {
      return (
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chat.group_data?.description && 
          chat.group_data.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (chat.group_data?.destination && 
          chat.group_data.destination.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    return false;
  });

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-5 pt-2 pb-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-2xl font-bold text-gray-900">Chats</Text>
          <View className="flex-row space-x-4">
            <TouchableOpacity 
              className="w-9 h-9 items-center justify-center rounded-full bg-gray-100"
              onPress={() => router.push("/(tabs)/explore")}
            >
              <Ionicons name="search" size={20} color="#333" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="w-9 h-9 items-center justify-center rounded-full bg-gray-100"
              onPress={() => setIsGroupModalVisible(true)}
            >
              <Ionicons name="people" size={20} color="#333" />
            </TouchableOpacity>
          </View>
        </View>
        <Text className="text-gray-500 text-sm mt-1">Your recent conversations</Text>
      </View>

      {/* Search Bar */}
      <View className="px-5 mb-4">
        <View className="flex-row items-center bg-gray-100 rounded-full px-4 py-2">
          <Ionicons name="search" size={18} color="#8E8E93" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by name or message..."
            placeholderTextColor="#8E8E93"
            className="flex-1 ml-2 text-base text-gray-800 font-medium"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <View className="bg-gray-300 rounded-full w-5 h-5 items-center justify-center">
                <Ionicons name="close" size={12} color="white" />
              </View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#007AFF" />
          <Text className="mt-4 text-gray-500">Loading your chats...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleChatPress(item)}
              className="px-5 py-3 border-b border-gray-100"
            >
              <View className="flex-row">
                {/* Avatar with indicators */}
                <View className="relative">
                  {item.type === 'group' ? (
                    <View className="w-14 h-14 rounded-full bg-blue-500 items-center justify-center">
                      <Ionicons name="people" size={24} color="#fff" />
                      {item.group_data && (
                        <View className="absolute -bottom-1 -right-1 bg-gray-100 rounded-full min-w-5 h-5 items-center justify-center px-1">
                          <Text className="text-xs text-gray-800 font-bold">
                            {item.group_data.member_count}
                          </Text>
                        </View>
                      )}
                    </View>
                  ) : (
                    item.image && item.image !== DEFAULT_PROFILE_IMAGE ? (
                      <Image
                        source={{ uri: item.image }}
                        className="w-14 h-14 rounded-full"
                      />
                    ) : (
                      <ProfileInitials name={item.name} size={56} />
                    )
                  )}
                  {item.isOnline && (
                    <View className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </View>

                {/* Chat details */}
                <View className="flex-1 ml-3 justify-center">
                  <View className="flex-row items-center justify-between">
                    <Text className={`font-semibold text-base ${item.unreadCount > 0 ? 'text-black' : 'text-gray-800'}`}>
                      {item.name}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {getTimeDisplay(item.last_active)}
                    </Text>
                  </View>
                  
                  <View className="flex-row items-center justify-between mt-1">
                    <Text numberOfLines={1} className={`text-sm ${item.unreadCount > 0 ? 'text-gray-800 font-medium' : 'text-gray-500'}`} style={{maxWidth: '80%'}}>
                      {item.lastMessage}
                    </Text>
                    
                    {item.unreadCount > 0 && (
                      <View className="bg-blue-500 rounded-full min-w-5 h-5 items-center justify-center px-1.5">
                        <Text className="text-white text-xs font-bold">
                          {item.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#007AFF"
              colors={["#007AFF"]}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={filteredChats.length === 0 ? { flex: 1 } : undefined}
        />
      )}

      {/* Tab Bar */}
      <View className="flex-row items-center justify-around py-3 border-t border-gray-200 bg-white">
        <TouchableOpacity className="items-center">
          <Ionicons name="home-outline" size={24} color="#8E8E93" />
          <Text className="text-xs text-gray-500 mt-1">Home</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center">
          <Ionicons name="map-outline" size={24} color="#8E8E93" />
          <Text className="text-xs text-gray-500 mt-1">Trips</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center">
          <Ionicons name="chatbubbles" size={24} color="#007AFF" />
          <Text className="text-xs text-blue-500 mt-1">Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center" onPress={() => setIsGroupModalVisible(true)}>
          <Ionicons name="people-outline" size={24} color="#8E8E93" />
          <Text className="text-xs text-gray-500 mt-1">Groups</Text>
        </TouchableOpacity>
        <TouchableOpacity className="items-center">
          <Ionicons name="person-outline" size={24} color="#8E8E93" />
          <Text className="text-xs text-gray-500 mt-1">Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Create Group Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isGroupModalVisible}
        onRequestClose={() => setIsGroupModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl max-h-[90%]">
            {/* Modal Header */}
            <View className="px-6 pt-6 pb-4 border-b border-gray-100">
              <View className="w-12 h-1 bg-gray-200 rounded-full self-center mb-6" />
              <View className="flex-row justify-between items-center">
                <TouchableOpacity onPress={() => setIsGroupModalVisible(false)}>
                  <Text className="text-blue-500 text-base font-medium">Cancel</Text>
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">Create Group</Text>
                <TouchableOpacity 
                  onPress={handleCreateGroup}
                  disabled={!groupForm.name || isCreatingGroup}
                >
                  <Text 
                    className={`text-base font-medium ${!groupForm.name || isCreatingGroup ? 'text-blue-300' : 'text-blue-500'}`}
                  >
                    Create
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView className="max-h-[70%]">
              <View className="p-6 space-y-6">
                {/* Group Name */}
                <View>
                  <Text className="text-gray-500 text-sm mb-2 font-medium">Group Name *</Text>
                  <View className="relative">
                    <TextInput
                      placeholder="Enter group name"
                      value={groupForm.name}
                      onChangeText={(text) => setGroupForm({...groupForm, name: text})}
                      className="bg-gray-100 px-4 py-3.5 rounded-lg font-medium text-gray-900 border border-gray-200"
                    />
                  </View>
                </View>
                
                {/* Group Description */}
                <View>
                  <Text className="text-gray-500 text-sm mb-2 font-medium">Description</Text>
                  <View className="relative">
                    <TextInput
                      placeholder="What's this group about?"
                      value={groupForm.description}
                      onChangeText={(text) => setGroupForm({...groupForm, description: text})}
                      className="bg-gray-100 px-4 py-3.5 rounded-lg font-medium text-gray-900 border border-gray-200"
                      multiline
                      numberOfLines={3}
                      textAlignVertical="top"
                      style={{ minHeight: 100 }}
                    />
                  </View>
                </View>
                
                {/* Travel Destination */}
                <View>
                  <Text className="text-gray-500 text-sm mb-2 font-medium">Travel Destination</Text>
                  <View className="relative">
                    <View className="absolute left-3.5 top-3.5 z-10">
                      <Ionicons name="location" size={20} color="#007AFF" />
                    </View>
                    <TextInput
                      placeholder="Where are you planning to travel?"
                      value={groupForm.destination}
                      onChangeText={(text) => setGroupForm({...groupForm, destination: text})}
                      className="bg-gray-100 pl-11 pr-4 py-3.5 rounded-lg font-medium text-gray-900 border border-gray-200"
                    />
                  </View>
                </View>
                
                {/* Travel Dates */}
                <View>
                  <Text className="text-gray-500 text-sm mb-2 font-medium">Travel Dates</Text>
                  <View className="flex-row gap-3">
                    <TouchableOpacity 
                      onPress={() => setShowStartDatePicker(true)}
                      className="flex-1"
                    >
                      <View className="relative">
                        <View className="absolute left-3.5 top-3.5 z-10">
                          <Ionicons name="calendar" size={20} color="#007AFF" />
                        </View>
                        <View className="bg-gray-100 pl-11 pr-4 py-3.5 rounded-lg border border-gray-200">
                          <Text className={groupForm.startDate ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                            {groupForm.startDate ? formatDateDisplay(groupForm.startDate) : 'Start Date'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={() => setShowEndDatePicker(true)}
                      className="flex-1"
                    >
                      <View className="relative">
                        <View className="absolute left-3.5 top-3.5 z-10">
                          <Ionicons name="calendar" size={20} color="#007AFF" />
                        </View>
                        <View className="bg-gray-100 pl-11 pr-4 py-3.5 rounded-lg border border-gray-200">
                          <Text className={groupForm.endDate ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                            {groupForm.endDate ? formatDateDisplay(groupForm.endDate) : 'End Date'}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                  
                  {showStartDatePicker && (
                    <DateTimePicker
                      value={groupForm.startDate ? new Date(groupForm.startDate) : new Date()}
                      mode="date"
                      display="default"
                      onChange={onStartDateChange}
                    />
                  )}
                  
                  {showEndDatePicker && (
                    <DateTimePicker
                      value={groupForm.endDate ? new Date(groupForm.endDate) : new Date()}
                      mode="date"
                      display="default"
                      onChange={onEndDateChange}
                    />
                  )}
                </View>
                
                {/* Group Members Selection */}
                <View>
                  <Text className="text-gray-500 text-sm mb-2 font-medium">Select Group Members</Text>
                  <View className="bg-gray-100 rounded-lg border border-gray-200 overflow-hidden">
                    {matches.length > 0 ? (
                      matches.map((match) => (
                        <TouchableOpacity 
                          key={match.userId} 
                          onPress={() => toggleMatchSelection(match.userId)}
                          className={`flex-row items-center p-4 border-b border-gray-200 ${
                            groupForm.selectedMembers.includes(match.userId) ? 'bg-blue-50' : ''
                          }`}
                        >
                          {match.profile_photo ? (
                            <Image 
                              source={{ uri: match.profile_photo || DEFAULT_PROFILE_IMAGE }}
                              className="h-10 w-10 rounded-full"
                            />
                          ) : (
                            <ProfileInitials name={match.username} size={40} />
                          )}
                          <View className="flex-1 ml-3">
                            <Text className="font-medium text-gray-900">
                              {match.username}
                            </Text>
                            <Text className="text-sm text-gray-500" numberOfLines={1}>
                              {match.bio || "No bio available"}
                            </Text>
                          </View>
                          <View className={`h-6 w-6 rounded-full items-center justify-center ${
                            groupForm.selectedMembers.includes(match.userId) 
                              ? 'bg-blue-500' 
                              : 'border-2 border-gray-300'
                          }`}>
                            {groupForm.selectedMembers.includes(match.userId) && (
                              <Ionicons name="checkmark" size={14} color="white" />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View className="p-6 items-center">
                        <Ionicons name="people" size={40} color="#007AFF" />
                        <Text className="text-center text-gray-500 mt-2">
                          No matches available
                        </Text>
                        <TouchableOpacity 
                          onPress={() => {
                            setIsGroupModalVisible(false);
                            router.push("/(tabs)/explore");
                          }}
                          className="mt-4 bg-blue-500 px-6 py-2 rounded-full"
                        >
                          <Text className="text-white font-medium">Find Matches</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                  <Text className="text-sm text-gray-500 mt-2">
                    Selected: {groupForm.selectedMembers.length} members
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            {/* Create Button (Mobile style) */}
            <View className="p-6 pt-4 border-t border-gray-100">
              <TouchableOpacity
                onPress={handleCreateGroup}
                disabled={!groupForm.name || isCreatingGroup}
                className={`py-3.5 rounded-lg items-center justify-center ${!groupForm.name || isCreatingGroup ? 'bg-gray-200' : 'bg-blue-500'}`}
              >
                {isCreatingGroup ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-medium ml-2">
                      Creating...
                    </Text>
                  </View>
                ) : (
                  <Text className={`font-medium ${!groupForm.name ? 'text-gray-500' : 'text-white'}`}>
                    Create Travel Group
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
