import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, SafeAreaView, FlatList, TouchableOpacity, Image, RefreshControl, ActivityIndicator, TextInput, Modal, ScrollView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import TabHeader from '@/src/components/shared/TabHeader';
import { SearchBar } from '@/src/components/shared/SearchBar';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
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
        className="flex-row items-center px-4 py-3.5"
        activeOpacity={0.7}
      >
        <View className="relative">
          {item.type === 'group' ? (
            // Group avatar with counter
            <View className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center">
              <Ionicons name="people" size={24} color="#fff" />
              {item.group_data && (
                <View className="absolute -bottom-1 -right-1 bg-primary-light rounded-full min-w-5 h-5 items-center justify-center px-1 border border-neutral-lightest">
                  <Text className="text-xs text-white font-montserratBold">
                    {item.group_data.member_count}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            // Regular user avatar
            <Image
              source={{ uri: item.image }}
              className="w-14 h-14 rounded-full"
            />
          )}
          
          {item.isOnline && item.type !== 'group' && (
            <View className="absolute bottom-0 right-0 w-3 h-3 bg-secondary rounded-full border-2 border-neutral-lightest" />
          )}
          
          {item.type === 'match' && (
            <View className="absolute -bottom-1 -right-1 bg-primary-light rounded-full w-5 h-5 items-center justify-center border border-neutral-lightest">
              <Ionicons name="heart" size={10} color="#fff" />
            </View>
          )}
        </View>

        <View className="flex-1 ml-3 border-b border-neutral-medium pb-3.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-montserratMedium text-neutral-darkest">
              {item.name}
            </Text>
            <Text className="text-xs text-neutral-dark font-montserrat">
              {getTimeDisplay(item.last_active)}
            </Text>
          </View>
          
          <View className="flex-row items-center justify-between mt-1">
            <View className="flex-1 mr-3">
              {item.type === 'group' && item.group_data?.destination && (
                <Text className="text-xs text-primary font-montserrat mb-1">
                  {item.group_data.destination}
                </Text>
              )}
              {renderMessagePreview(item.lastMessage, item.lastMessageType)}
            </View>
            
            {item.unreadCount > 0 && (
              <View className="bg-primary rounded-full min-w-5 h-5 items-center justify-center px-1">
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
      <Ionicons name="chatbubbles-outline" size={48} color="#E6E4EC" />
      <Text className="mt-4 text-center text-neutral-dark font-montserrat">
        {error || "No matches or groups yet.\nKeep swiping to find connections or create a group!"}
      </Text>
      <View className="flex-row mt-6">
        <TouchableOpacity 
          onPress={() => router.push("/(tabs)/explore")}
          className="mr-2 bg-primary px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-montserratMedium">Explore Users</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setIsGroupModalVisible(true)}
          className="ml-2 bg-secondary px-6 py-3 rounded-xl"
        >
          <Text className="text-white font-montserratMedium">Create Group</Text>
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
    <SafeAreaView className="flex-1 bg-neutral-light">
      <TabHeader
        title="Chats"
        subtitle="Your matches and travel groups"
        gradientColors={['rgba(125, 91, 166, 0.9)', 'rgba(90, 65, 128, 0.8)']}
        rightContent={
          <TouchableOpacity 
            onPress={() => setIsGroupModalVisible(true)}
            className="px-2 py-1"
          >
            <Ionicons name="people" size={24} color="white" />
          </TouchableOpacity>
        }
      />

      <View className="px-4 py-2">
        <View className="flex-row items-center bg-white rounded-xl px-3 py-2 shadow-sm">
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search chats..."
            placeholderTextColor="#9CA3AF"
            className="ml-2 flex-1 text-neutral-dark font-montserrat"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#7D5BA6" />
          <Text className="mt-4 text-neutral-dark font-montserrat">Loading your chats...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredChats}
          renderItem={renderChatItem}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#7D5BA6"
              colors={["#7D5BA6"]}
            />
          }
          ListEmptyComponent={renderEmptyComponent}
          contentContainerStyle={filteredChats.length === 0 ? { flex: 1 } : undefined}
        />
      )}

      {/* New Chat FAB */}
      <TouchableOpacity
        onPress={() => router.push("/(tabs)/explore")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-primary rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: "#7D5BA6",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 5
        }}
      >
        <Ionicons name="search" size={24} color="#fff" />
      </TouchableOpacity>
      
      {/* Create Group FAB */}
      <TouchableOpacity
        onPress={() => setIsGroupModalVisible(true)}
        className="absolute bottom-6 left-6 w-14 h-14 bg-secondary rounded-full items-center justify-center shadow-lg"
        style={{
          shadowColor: "#FF6F3C",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 5
        }}
      >
        <Ionicons name="people" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Create Travel Group Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isGroupModalVisible}
        onRequestClose={() => setIsGroupModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl max-h-[90%]">
            <View className="p-4 border-b border-neutral-medium">
              <View className="flex-row justify-between items-center">
                <Text className="font-montserratBold text-xl text-neutral-darkest">
                  Create Travel Group
                </Text>
                <TouchableOpacity 
                  onPress={() => setIsGroupModalVisible(false)}
                  className="p-2"
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView className="max-h-[70%]">
              <View className="p-4">
                {/* Group Name */}
                <View className="mb-4">
                  <Text className="font-montserratMedium text-neutral-dark mb-2">
                    Group Name *
                  </Text>
                  <TextInput
                    placeholder="Enter group name"
                    value={groupForm.name}
                    onChangeText={(text) => setGroupForm({...groupForm, name: text})}
                    className="bg-neutral-lightest p-3 rounded-xl font-montserrat text-neutral-darkest border border-neutral-light"
                  />
                </View>
                
                {/* Group Description */}
                <View className="mb-4">
                  <Text className="font-montserratMedium text-neutral-dark mb-2">
                    Description
                  </Text>
                  <TextInput
                    placeholder="What's this group about?"
                    value={groupForm.description}
                    onChangeText={(text) => setGroupForm({...groupForm, description: text})}
                    className="bg-neutral-lightest p-3 rounded-xl font-montserrat text-neutral-darkest border border-neutral-light"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
                
                {/* Travel Destination */}
                <View className="mb-4">
                  <Text className="font-montserratMedium text-neutral-dark mb-2">
                    Travel Destination
                  </Text>
                  <TextInput
                    placeholder="Where are you planning to travel?"
                    value={groupForm.destination}
                    onChangeText={(text) => setGroupForm({...groupForm, destination: text})}
                    className="bg-neutral-lightest p-3 rounded-xl font-montserrat text-neutral-darkest border border-neutral-light"
                  />
                </View>
                
                {/* Travel Dates */}
                <View className="mb-4">
                  <Text className="font-montserratMedium text-neutral-dark mb-2">
                    Travel Dates
                  </Text>
                  <View className="flex-row gap-2">
                    <TouchableOpacity 
                      onPress={() => setShowStartDatePicker(true)}
                      className="flex-1 flex-row items-center justify-between bg-neutral-lightest p-3 rounded-xl border border-neutral-light"
                    >
                      <Text className={`font-montserrat ${groupForm.startDate ? 'text-neutral-darkest' : 'text-neutral-dark'}`}>
                        {groupForm.startDate ? formatDateDisplay(groupForm.startDate) : 'Start Date'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      onPress={() => setShowEndDatePicker(true)}
                      className="flex-1 flex-row items-center justify-between bg-neutral-lightest p-3 rounded-xl border border-neutral-light"
                    >
                      <Text className={`font-montserrat ${groupForm.endDate ? 'text-neutral-darkest' : 'text-neutral-dark'}`}>
                        {groupForm.endDate ? formatDateDisplay(groupForm.endDate) : 'End Date'}
                      </Text>
                      <Ionicons name="calendar-outline" size={20} color="#6B7280" />
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
                <View className="mb-4">
                  <Text className="font-montserratMedium text-neutral-dark mb-2">
                    Select Group Members
                  </Text>
                  <View className="bg-neutral-lightest p-3 rounded-xl border border-neutral-light">
                    {matches.length > 0 ? (
                      matches.map((match) => (
                        <TouchableOpacity 
                          key={match.userId} 
                          onPress={() => toggleMatchSelection(match.userId)}
                          className={`flex-row items-center p-2 mb-2 rounded-lg ${
                            groupForm.selectedMembers.includes(match.userId) ? 'bg-primary/10' : 'bg-white'
                          }`}
                        >
                          <Image 
                            source={{ uri: match.profile_photo || DEFAULT_PROFILE_IMAGE }}
                            className="h-10 w-10 rounded-full"
                          />
                          <View className="flex-1 ml-3">
                            <Text className="font-montserratMedium text-neutral-darkest">
                              {match.username}
                            </Text>
                            <Text className="text-xs text-neutral-dark font-montserrat" numberOfLines={1}>
                              {match.bio || "No bio available"}
                            </Text>
                          </View>
                          <View className={`h-6 w-6 rounded-full border items-center justify-center ${
                            groupForm.selectedMembers.includes(match.userId) 
                              ? 'border-0 bg-primary' 
                              : 'border-neutral-medium'
                          }`}>
                            {groupForm.selectedMembers.includes(match.userId) && (
                              <Ionicons name="checkmark" size={16} color="white" />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <Text className="p-3 text-center text-neutral-dark font-montserrat">
                        No matches available
                      </Text>
                    )}
                  </View>
                  <Text className="text-xs text-neutral-dark mt-1 font-montserrat">
                    Selected: {groupForm.selectedMembers.length}
                  </Text>
                </View>
              </View>
            </ScrollView>
            
            <View className="p-4 border-t border-neutral-medium">
              <TouchableOpacity
                onPress={handleCreateGroup}
                className={`${isCreatingGroup ? 'bg-primary/70' : 'bg-primary'} py-3 rounded-xl items-center flex-row justify-center`}
                activeOpacity={0.8}
                disabled={isCreatingGroup}
              >
                {isCreatingGroup ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text className="text-white font-montserratBold text-base ml-2">
                      Creating...
                    </Text>
                  </>
                ) : (
                  <Text className="text-white font-montserratBold text-base">
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
