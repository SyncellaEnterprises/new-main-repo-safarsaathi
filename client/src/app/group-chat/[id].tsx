import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react';
import { View, Text, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Dimensions, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSocket } from '@/src/context/SocketContext';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { Camera, CameraType } from 'expo-camera';
import { BlurView } from 'expo-blur';
import IMAGES from "@/src/constants/images";

const { width, height } = Dimensions.get('window');

// Environment configuration
const API_URL = 'http://10.0.2.2:5000';

// Add ProfileInitials component for avatar fallbacks
const ProfileInitials = ({ username, size, textSize, backgroundColor = '#007AFF' }: {
  username: string;
  size: number;
  textSize: number;
  backgroundColor?: string;
}) => {
  const initial = username && username.length > 0 ? username.charAt(0).toUpperCase() : '?';

  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor,
      justifyContent: 'center',
      alignItems: 'center',
    }}>
      <Text style={{
        color: 'white',
        fontSize: textSize,
        fontWeight: 'bold',
      }}>
        {initial}
      </Text>
    </View>
  );
};

interface GroupMessage {
  message_id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  group_id: string;
  sent_at: string;
  type: 'text' | 'image' | 'video';
  expires_at?: string; // For ephemeral messages
}

interface GroupMember {
  user_id: number;
  username: string;
  profile_photo: string | null;
  is_admin: boolean;
  joined_at: string;
  is_online?: boolean;
}

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
  members: GroupMember[];
}

// Add helper function to format message date headers
const getMessageDateHeader = (dateString: string) => {
  const messageDate = new Date(dateString);
  const today = new Date();

  // Reset hours to compare just the dates
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayDate = new Date(todayDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);

  // Format the message date without time
  const messageDateOnly = new Date(messageDate.getFullYear(), messageDate.getMonth(), messageDate.getDate());

  if (messageDateOnly.getTime() === todayDate.getTime()) {
    return 'Today';
  } else if (messageDateOnly.getTime() === yesterdayDate.getTime()) {
    return 'Yesterday';
  } else {
    // Format dates older than yesterday
    return messageDate.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

export default function GroupChatScreen() {
  const params = useLocalSearchParams();
  const groupId = params.id as string;
  const { socket, isConnected, isConnecting, joinGroupChat, sendGroupMessage } = useSocket();
  const { user } = useAuth();
  const router = useRouter();

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [groupInfo, setGroupInfo] = useState<TravelGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [onlineMembers, setOnlineMembers] = useState<Set<string>>(new Set());
  const [showCamera, setShowCamera] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const messageListRef = useRef<FlatList>(null);
  const cameraRef = useRef<any>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedMatches, setSelectedMatches] = useState<number[]>([]);
  const [groupActivity, setGroupActivity] = useState<{action: string, timestamp: string}[]>([]);
  const [availableMatches, setAvailableMatches] = useState<any[]>([]);

  // Request camera permissions
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Fetch group details
  const fetchGroupDetails = useCallback(async () => {
    try {
      // Get JWT token
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      console.log(`Fetching group details for group ID: ${groupId}`);
      const response = await axios.get(`${API_URL}/api/groups/${groupId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.group) {
        console.log('Group details received:', response.data.group);
        setGroupInfo(response.data.group);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Error',
          text2: 'Failed to load group details'
        });
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load group details'
      });
    }
  }, [groupId]);

  // Fetch group messages
  const fetchGroupMessages = useCallback(async () => {
    try {
      // Get JWT token
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      console.log(`Fetching messages for group ID: ${groupId}`);
      const response = await axios.get(`${API_URL}/api/groups/${groupId}/messages`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success && response.data.messages) {
        console.log(`Received ${response.data.messages.length} group messages`);
        setMessages(response.data.messages);
      } else {
        console.log('No messages found or error in response');
      }
    } catch (error) {
      console.error('Error fetching group messages:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load group messages'
      });
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  // Join the group chat when connected
  useEffect(() => {
    if (isConnected && groupId) {
      joinGroupChat(groupId);
      // Initial data loading
      fetchGroupDetails();
      fetchGroupMessages();
    }
  }, [isConnected, groupId, joinGroupChat, fetchGroupDetails, fetchGroupMessages]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // Handler for when successfully joined a group chat
    const handleGroupChatJoined = (data: {
      group_id: string;
      online_members: string[];
    }) => {
      console.log('Group chat joined with data:', JSON.stringify(data));

      if (data.group_id === groupId) {
        // Update online members
        setOnlineMembers(new Set(data.online_members));
      }
    };

    // Handler for new group messages
    const handleNewGroupMessage = (message: any) => {
      console.log('New group message received:', JSON.stringify(message));

      // Validate the message object
      if (!message || typeof message !== 'object') {
        console.warn('Received invalid message object');
        return;
      }

      // Map the server response to our GroupMessage interface
      const groupMessage: GroupMessage = {
        message_id: message.id || String(Date.now()),
        content: message.content || message.message || '',
        sender_id: String(message.sender_id),
        sender_name: message.sender_username || '',
        group_id: String(message.group_id),
        sent_at: message.timestamp || message.sent_at || new Date().toISOString(),
        type: message.type || 'text'
      };

      if (String(message.group_id) === groupId) {
        setMessages(prev => [...prev, groupMessage]);

        // Scroll to bottom on new message
        setTimeout(() => {
          messageListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    };

    // Handler for member status updates
    const handleMemberStatus = (data: { group_id: string; user_id: string; status: 'online' | 'offline' }) => {
      if (data.group_id === groupId) {
        setOnlineMembers(prev => {
          const updated = new Set(prev);
          if (data.status === 'online') {
            updated.add(data.user_id);
          } else {
            updated.delete(data.user_id);
          }
          return updated;
        });
      }
    };

    // Set up event listeners
    socket.on('joined_group', handleGroupChatJoined);
    socket.on('group_message', handleNewGroupMessage);
    socket.on('group_member_status', handleMemberStatus);

    // Clean up event listeners
    return () => {
      socket.off('joined_group', handleGroupChatJoined);
      socket.off('group_message', handleNewGroupMessage);
      socket.off('group_member_status', handleMemberStatus);
    };
  }, [socket, groupId]);

  // Handle sending a message
  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    try {
      // Simulate message send failure for demo
      if (Math.random() > 0.7) {
        setSendError("Message failed to send. Try again.");
        return;
      }

      sendGroupMessage(newMessage.trim(), groupId);
      setNewMessage('');
      setSendError(null);

      // Scroll to bottom after sending
      scrollViewRef.current?.scrollToEnd({ animated: true });
    } catch (error) {
      console.error('Error sending message:', error);
      setSendError("Message failed to send. Try again.");
    }
  };

  // Format date for display
  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        // Return current time if date is invalid
        return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      console.warn('Error formatting date:', error);
      return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  // Format date range for display
  const formatDateRange = () => {
    if (!groupInfo || !groupInfo.start_date || !groupInfo.end_date) {
      return '';
    }

    try {
      const startDate = new Date(groupInfo.start_date);
      const endDate = new Date(groupInfo.end_date);

      const startFormat = startDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });

      const endFormat = endDate.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      return `${startFormat} - ${endFormat}`;
    } catch (error) {
      console.warn('Error formatting date range:', error);
      return '';
    }
  };

  // Render message items with Snapchat-style bubbles
  const renderMessage = ({ item }: { item: GroupMessage }) => {
    if (!item || !user) return null;

    const senderId = String(item.sender_id || '');
    const userId = String(user.id || '');
    const isOwnMessage = senderId === userId;

    return (
      <Animated.View
        entering={FadeIn}
        className={`flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 px-2`}
      >
        {!isOwnMessage && (
          <Image
            source={{
              uri: groupInfo?.members.find(m => String(m.user_id) === senderId)?.profile_photo ||
                'https://via.placeholder.com/400x400?text=No+Profile+Image'
            }}
            className="h-6 w-6 rounded-full mr-2 mt-2"
          />
        )}
        <View className={`max-w-[75%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {!isOwnMessage && (
            <Text className="text-xs text-gray-500 mb-1 ml-1">
              {item.sender_name}
            </Text>
          )}
          <LinearGradient
            colors={isOwnMessage
              ? ['#1E9AFF', '#1E9AFF']  // Snapchat blue for own messages
              : ['#E8E8E8', '#E8E8E8']} // Light gray for received messages
            className={`rounded-3xl px-4 py-3 ${isOwnMessage ? 'rounded-tr-sm' : 'rounded-tl-sm'
              }`}
          >
            {item.type === 'text' && (
              <Text className={`${isOwnMessage ? 'text-white' : 'text-black'} font-medium text-base`}>
                {item.content}
              </Text>
            )}
            {item.type === 'image' && (
              <Image
                source={{ uri: item.content }}
                className="w-48 h-48 rounded-2xl"
                resizeMode="cover"
              />
            )}
          </LinearGradient>

          <Text className="text-xs text-gray-500 mt-1 mx-1">
            {formatMessageTime(item.sent_at)}
          </Text>
        </View>
      </Animated.View>
    );
  };

  // Empty state for no messages
  const renderEmptyMessages = () => (
    <View className="flex-1 items-center justify-center p-4">
      <Ionicons name="chatbubbles-outline" size={64} color="#E6E4EC" />
      <Text className="text-neutral-dark mt-4 text-center font-montserrat">
        No messages yet.{'\n'}Be the first to say hello to the group!
      </Text>
    </View>
  );

  // Updated Camera View renderer to fix typing issues
  const renderCameraView = () => (
    <View style={styles.cameraContainer}>
      {hasPermission && (
        <Camera
          ref={cameraRef}
          style={styles.camera}
          type={CameraType.back}
        >
          <View style={styles.cameraOverlay}>
            <BlurView intensity={100} style={styles.cameraControls}>
              <View style={styles.cameraButtonsContainer}>
                <TouchableOpacity
                  style={styles.cameraCloseButton}
                  onPress={() => setShowCamera(false)}
                >
                  <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.captureButton}
                  onPress={() => {/* Handle capture */ }}
                >
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cameraSwitchButton}
                  onPress={() => {/* Switch camera */ }}
                >
                  <Ionicons name="camera-reverse" size={30} color="white" />
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Camera>
      )}
    </View>
  );

  // Updated fetchAvailableMatches function to directly call the API
  const fetchAvailableMatches = useCallback(async () => {
    try {
      // Get JWT token
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        throw new Error('No access token found');
      }

      // Make API request to get matches
      console.log('Fetching matches for group member selection...');
      const response = await axios.get(`${API_URL}/api/matches/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.matches) {
        // Filter out matches that are already in the group
        const currentMemberIds = groupInfo?.members?.map(m => m.user_id) || [];
        const filteredMatches = response.data.matches.filter(
          (match: any) => !currentMemberIds.includes(match.userId)
        );
        
        setAvailableMatches(filteredMatches);
      } else {
        setAvailableMatches([]);
      }
    } catch (error) {
      console.error('Error fetching matches:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to load matches'
      });
    }
  }, [groupInfo]);

  // Replace the addMembersToGroup function with a local simulation approach
  const addMembersToGroup = async () => {
    if (selectedMatches.length === 0) return;
    
    try {
      // Get the selected matches
      const selectedUsers = selectedMatches.map(userId => 
        availableMatches.find(m => m.userId === userId)
      ).filter(Boolean);

      console.log('Simulating addition of members:', selectedUsers.map(u => u?.username));

      // Create fake member objects to add to the group
      const newMembers: GroupMember[] = selectedUsers.map(match => ({
        user_id: match?.userId || 0,
        username: match?.username || 'Unknown User',
        profile_photo: match?.profile_photo || null,
        is_admin: false,
        joined_at: new Date().toISOString(),
        is_online: true
      }));

      // Update the local group info with new members
      if (groupInfo) {
        const updatedGroupInfo = {
          ...groupInfo,
          members: [...groupInfo.members, ...newMembers],
          member_count: groupInfo.member_count + newMembers.length
        };
        setGroupInfo(updatedGroupInfo);
      }

      // Add activity items for the newly added members
      const newActivities = selectedUsers.map(match => ({
        action: `${user?.username || 'You'} added ${match?.username || 'a new member'}`,
        timestamp: new Date().toISOString()
      }));

      setGroupActivity(prev => [...newActivities, ...prev]);
      
      // Show success message
      Toast.show({
        type: 'success',
        text1: 'Members Added',
        text2: `${selectedUsers.length} members have been added to the group`
      });
      
      // Reset selection and close modal
      setSelectedMatches([]);
      setShowAddMemberModal(false);
      
      // For testing: log what would have been sent to the API
      console.log('For API implementation, would have sent these member IDs:', selectedMatches);

    } catch (error) {
      console.error('Error in simulated member addition:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to add members to the group'
      });
    }
  };

  // Toggle match selection function
  const toggleMatchSelection = (userId: number) => {
    setSelectedMatches(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  // Fix the renderAddMembersModal function to use the correct handlers
  const renderAddMembersModal = () => (
    <BlurView intensity={90} style={styles.modalOverlay}>
      <View style={styles.membersModal}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>
            Add Members
          </Text>
          <TouchableOpacity onPress={() => setShowAddMemberModal(false)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        {availableMatches.length === 0 ? (
          <View style={styles.emptyMatchesContainer}>
            <Ionicons name="people" size={48} color="#E5E5EA" />
            <Text style={styles.emptyMatchesText}>No available matches</Text>
            <Text style={styles.emptyMatchesSubtext}>
              All your matches are already in this group or you need to find new matches
            </Text>
          </View>
        ) : (
          <FlatList
            data={availableMatches}
            keyExtractor={item => String(item.userId)}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={[
                  styles.matchItem,
                  selectedMatches.includes(item.userId) && styles.selectedMatchItem
                ]}
                onPress={() => toggleMatchSelection(item.userId)}
              >
                {item.profile_photo ? (
                  <Image 
                    source={{ uri: item.profile_photo }}
                    style={styles.matchAvatar}
                  />
                ) : (
                  <ProfileInitials
                    username={item.username}
                    size={40}
                    textSize={16}
                    backgroundColor="#5856D6"
                  />
                )}
                
                <View style={styles.matchInfo}>
                  <Text style={styles.matchName}>{item.username}</Text>
                  <Text style={styles.matchBio} numberOfLines={1}>
                    {item.bio || "No bio available"}
                  </Text>
                </View>
                
                <View style={[
                  styles.checkboxContainer,
                  selectedMatches.includes(item.userId) && styles.checkboxSelected
                ]}>
                  {selectedMatches.includes(item.userId) && (
                    <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListFooterComponent={
              selectedMatches.length > 0 ? (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={addMembersToGroup}
                >
                  <Text style={styles.addButtonText}>
                    Add {selectedMatches.length} Member{selectedMatches.length > 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              ) : null
            }
          />
        )}
      </View>
    </BlurView>
  );

  // Group Activity Feed Component
  const renderActivityFeed = () => (
    <View style={styles.activityContainer}>
      <Text style={styles.activityHeader}>Activity</Text>
      
      {(() => {
        let currentDateHeader = '';
        let activityItems: JSX.Element[] = [];
        
        groupActivity.forEach((activity, index) => {
          const dateHeader = getMessageDateHeader(activity.timestamp);
          
          // Add date header if it's a new date
          if (dateHeader !== currentDateHeader) {
            currentDateHeader = dateHeader;
            activityItems.push(
              <View key={`header-${index}`} style={styles.dateHeaderContainer}>
                <Text style={styles.dateHeaderText}>{dateHeader}</Text>
              </View>
            );
          }
          
          // Add activity item
          activityItems.push(
            <View key={`activity-${index}`} style={styles.activityItem}>
              <View style={styles.activityDot} />
              <Text style={styles.activityText}>{activity.action}</Text>
              <Text style={styles.activityTime}>
                {formatMessageTime(activity.timestamp)}
              </Text>
            </View>
          );
        });
        
        return activityItems;
      })()}
    </View>
  );

  // Show loading state
  if (isConnecting || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1E9AFF" />
        <Text className="mt-4 text-gray-500">Loading group chat...</Text>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-light">
        <Ionicons name="wifi-outline" size={64} color="#E6E4EC" />
        <Text className="mt-4 text-center text-neutral-dark font-montserrat">
          Connection lost. Reconnecting...
        </Text>
      </View>
    );
  }

  // Render group members modal
  const renderMembersModal = () => (
    <BlurView intensity={90} className="absolute inset-0">
      <View className="flex-1 m-4 mt-16 bg-white rounded-3xl overflow-hidden">
        <View className="p-4 border-b border-gray-100 flex-row items-center justify-between">
          <Text className="text-xl font-bold text-gray-900">
            Group Members ({groupInfo?.members?.length || 0})
          </Text>
          <TouchableOpacity onPress={() => setShowMembers(false)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>
        
        {/* Add Member Button */}
        <TouchableOpacity 
          style={styles.addMemberButton} 
          onPress={() => {
            fetchAvailableMatches();
            setShowAddMemberModal(true);
          }}
        >
          <View style={styles.addMemberIconContainer}>
            <Ionicons name="person-add" size={22} color="#FFFFFF" />
          </View>
          <Text style={styles.addMemberText}>Add Members</Text>
        </TouchableOpacity>
        
        <FlatList
          data={groupInfo?.members}
          keyExtractor={item => String(item.user_id)}
          renderItem={({ item }) => (
            <View className="flex-row items-center p-4 border-b border-gray-100">
              <Image
                source={{
                  uri: item.profile_photo || 'https://via.placeholder.com/400x400?text=User'
                }}
                className="w-10 h-10 rounded-full"
              />
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <Text className="text-base font-medium text-gray-900">
                    {item.username}
                  </Text>
                  {item.is_admin && (
                    <View className="ml-2 px-2 py-0.5 bg-blue-100 rounded-full">
                      <Text className="text-xs text-blue-500 font-medium">Admin</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-gray-500">
                  {onlineMembers.has(String(item.user_id)) ? 'Online' : 'Offline'}
                </Text>
              </View>
              {String(item.user_id) !== String(user?.id) && (
                <TouchableOpacity
                  className="p-2"
                  onPress={() => {
                    setShowMembers(false);
                    router.push(`/chat/${item.user_id}`);
                  }}
                >
                  <Ionicons name="chatbubble" size={20} color="#1E9AFF" />
                </TouchableOpacity>
              )}
            </View>
          )}
        />
      </View>
    </BlurView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />


      {/* Welcome Title */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#007AFF" />
        </TouchableOpacity>

        <View>
          <Text style={styles.welcomeTitle}>
            {groupInfo?.name || "Group Chat"}
          </Text>
          {groupInfo?.destination && (
            <Text style={styles.destinationText}>
              <Ionicons name="location" size={16} color="#FF4D6D" />
              {" "}{groupInfo.destination}
            </Text>
          )}
          {groupInfo?.start_date && groupInfo?.end_date && (
            <Text style={styles.dateText}>
              <Ionicons name="calendar" size={16} color="#007AFF" />
              {" "}{formatDateRange()}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setShowMembers(true)}
        >
          <Ionicons name="people" size={24} color="#007AFF" />
        </TouchableOpacity>


      </View>

      {/* Error Message */}
      {sendError && (
        <TouchableOpacity
          style={styles.errorContainer}
          onPress={() => handleSendMessage()}
        >
          <Text style={styles.errorText}>{sendError}</Text>
          <Text style={styles.errorSubtext}>Tap to retry</Text>
        </TouchableOpacity>
      )}

      {/* Chat Area */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>👋</Text>
            <Text style={styles.emptyText}>
              No messages yet. Be the first to say hi!
            </Text>
          </View>
        ) : (
          <>
            {/* Group messages by date and add date headers */}
            {(() => {
              let currentDateHeader = '';
              let messageGroups: JSX.Element[] = [];

              messages.forEach((message, index) => {
                const dateHeader = getMessageDateHeader(message.sent_at);

                // Add date header if it's a new date
                if (dateHeader !== currentDateHeader) {
                  currentDateHeader = dateHeader;
                  messageGroups.push(
                    <View key={`header-${message.message_id}`} style={styles.dateHeaderContainer}>
                      <Text style={styles.dateHeaderText}>{dateHeader}</Text>
                    </View>
                  );
                }

                const isOwnMessage = String(message.sender_id) === String(user?.id);
                const sender = groupInfo?.members.find(m => String(m.user_id) === String(message.sender_id));

                messageGroups.push(
                  <View
                    key={message.message_id}
                    style={[
                      styles.messageContainer,
                      isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
                    ]}
                  >
                    {!isOwnMessage && (
                      <View style={styles.avatarContainer}>
                        {sender?.profile_photo ? (
                          <Image
                            source={{ uri: sender.profile_photo }}
                            style={styles.avatar}
                          />
                        ) : (
                          <ProfileInitials
                            username={message.sender_name || 'User'}
                            size={36}
                            textSize={14}
                            backgroundColor="#5856D6"
                          />
                        )}
                      </View>
                    )}

                    <View style={[
                      styles.messageContentContainer,
                      isOwnMessage ? styles.ownMessageContent : styles.otherMessageContent
                    ]}>
                      {!isOwnMessage && (
                        <Text style={styles.senderName}>
                          {message.sender_name}
                        </Text>
                      )}

                      <View style={[
                        styles.messageBubble,
                        isOwnMessage ? styles.ownBubble : styles.otherBubble
                      ]}>
                        <Text style={[
                          styles.messageText,
                          isOwnMessage ? styles.ownMessageText : styles.otherMessageText
                        ]}>
                          {message.content}
                        </Text>
                      </View>

                      <Text style={styles.messageTime}>
                        {formatMessageTime(message.sent_at)}
                      </Text>
                    </View>
                  </View>
                );
              });

              return messageGroups;
            })()}
          </>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="attach" size={24} color="#8E8E93" />
          </TouchableOpacity>

          <TextInput
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type your message..."
            style={styles.input}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              !newMessage.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
          >
            <Ionicons
              name="send"
              size={20}
              color={newMessage.trim() ? "#FFFFFF" : "#8E8E93"}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Members Modal */}
      {showMembers && (
        <BlurView intensity={90} style={styles.modalOverlay}>
          <View style={styles.membersModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Group Members ({groupInfo?.members?.length || 0})
              </Text>
              <TouchableOpacity onPress={() => setShowMembers(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            {/* Add Member Button */}
            <TouchableOpacity 
              style={styles.addMemberButton} 
              onPress={() => {
                fetchAvailableMatches();
                setShowAddMemberModal(true);
              }}
            >
              <View style={styles.addMemberIconContainer}>
                <Ionicons name="person-add" size={22} color="#FFFFFF" />
              </View>
              <Text style={styles.addMemberText}>Add Members</Text>
            </TouchableOpacity>
            
            <FlatList
              data={groupInfo?.members}
              keyExtractor={item => String(item.user_id)}
              renderItem={({ item }) => (
                <View style={styles.memberItem}>
                  {item.profile_photo ? (
                    <Image 
                      source={{ uri: item.profile_photo }}
                      style={styles.memberAvatar}
                    />
                  ) : (
                    <ProfileInitials
                      username={item.username}
                      size={40}
                      textSize={16}
                      backgroundColor="#5856D6"
                    />
                  )}
                  <View style={styles.memberInfo}>
                    <View style={styles.memberNameRow}>
                      <Text style={styles.memberName}>
                        {item.username}
                      </Text>
                      {item.is_admin && (
                        <View style={styles.adminBadge}>
                          <Text className="text-xs text-blue-500 font-medium">Admin</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.memberStatus}>
                      {onlineMembers.has(String(item.user_id)) ? 'Online' : 'Offline'}
                    </Text>
                  </View>
                  {String(item.user_id) !== String(user?.id) && (
                    <TouchableOpacity 
                      style={styles.dmButton}
                      onPress={() => {
                        setShowMembers(false);
                        router.push(`/chat/${item.user_id}`);
                      }}
                    >
                      <Ionicons name="chatbubble" size={20} color="#1E9AFF" />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            />
          </View>
        </BlurView>
      )}

      {/* Add Members Modal */}
      {showAddMemberModal && renderAddMembersModal()}

      {/* Group Activity Feed */}
      {groupActivity.length > 0 && renderActivityFeed()}

      {/* Camera Overlay */}
      {showCamera && renderCameraView()}

      {/* Home Indicator */}
      <View style={styles.homeIndicator} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  backButton: {
    padding: 8,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
  },
  menuButton: {
    padding: 8,
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
  },
  destinationText: {
    fontSize: 15,
    color: '#666666',
    marginTop: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  errorContainer: {
    backgroundColor: '#FF3B30',
    marginHorizontal: 20,
    marginBottom: 16,
    padding: 16,
    borderRadius: 12,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  errorSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '90%',
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  avatarContainer: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E5EA',
  },
  messageContentContainer: {
    flexDirection: 'column',
    maxWidth: '80%',
  },
  ownMessageContent: {
    alignItems: 'flex-end',
  },
  otherMessageContent: {
    alignItems: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
    fontWeight: '500',
  },
  messageBubble: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  ownBubble: {
    backgroundColor: '#007AFF',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#F2F2F7',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  homeIndicator: {
    width: 134,
    height: 5,
    backgroundColor: '#000000',
    opacity: 0.1,
    borderRadius: 2.5,
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  membersModal: {
    margin: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    width: '90%',
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#000000',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
  },
  memberInfo: {
    flex: 1,
    marginLeft: 12,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  adminBadge: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  memberStatus: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  dmButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'black',
    zIndex: 1000,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  cameraButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 20,
  },
  cameraCloseButton: {
    padding: 10,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 4,
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'white',
  },
  cameraSwitchButton: {
    padding: 10,
  },
  dateHeaderContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    fontSize: 13,
    color: '#8E8E93',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    overflow: 'hidden',
    fontWeight: '500',
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  addMemberIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addMemberText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    marginLeft: 12,
  },
  emptyMatchesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    flex: 1,
  },
  emptyMatchesText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 16,
  },
  emptyMatchesSubtext: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 8,
  },
  matchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  selectedMatchItem: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  matchAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
  },
  matchInfo: {
    flex: 1,
    marginLeft: 12,
  },
  matchName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  matchBio: {
    fontSize: 14,
    color: '#8E8E93',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  addButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  activityContainer: {
    padding: 16,
    backgroundColor: '#F9F9F9',
  },
  activityHeader: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingLeft: 12,
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
    marginRight: 12,
  },
  activityText: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
  },
  activityTime: {
    fontSize: 12,
    color: '#8E8E93',
  },
}); 