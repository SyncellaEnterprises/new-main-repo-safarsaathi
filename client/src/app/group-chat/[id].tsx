import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSocket } from '@/src/context/SocketContext';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';
import { Camera } from 'expo-camera';
import { BlurView } from 'expo-blur';

const { width, height } = Dimensions.get('window');

// Environment configuration
const API_URL = 'http://10.0.2.2:5000';

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
  const cameraRef = useRef<Camera | null>(null);

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
    if (!newMessage.trim() || !isConnected || !groupId) return;

    console.log(`Attempting to send group message to group ${groupId}:`, newMessage.trim());
    
    try {
      sendGroupMessage(newMessage.trim(), groupId);
      console.log('Group message sent successfully');
      setNewMessage('');
      
      // Scroll to bottom after sending
      setTimeout(() => {
        messageListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending group message:', error);
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Failed to send message. Please try again.'
      });
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
            className={`rounded-3xl px-4 py-3 ${
              isOwnMessage ? 'rounded-tr-sm' : 'rounded-tl-sm'
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

  // Camera view component
  const renderCameraView = () => (
    <View className="absolute inset-0 bg-black">
      {hasPermission && (
        <Camera
          ref={cameraRef}
          className="flex-1"
          type={Camera.Constants.Type.back}
        >
          <View className="flex-1 bg-transparent">
            <BlurView intensity={100} className="absolute bottom-0 left-0 right-0 h-24">
              <View className="flex-row items-center justify-around py-4">
                <TouchableOpacity onPress={() => setShowCamera(false)}>
                  <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>
                <TouchableOpacity 
                  className="w-16 h-16 rounded-full border-4 border-white items-center justify-center"
                  onPress={() => {/* Handle capture */}}
                >
                  <View className="w-12 h-12 rounded-full bg-white" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => {/* Switch camera */}}>
                  <Ionicons name="camera-reverse" size={30} color="white" />
                </TouchableOpacity>
              </View>
            </BlurView>
          </View>
        </Camera>
      )}
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
    <SafeAreaView className="flex-1 bg-white">
      {/* Minimal Header */}
      <View className="px-4 py-2 flex-row items-center border-b border-gray-100">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="p-2"
        >
          <Ionicons name="chevron-back" size={24} color="#1E9AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => router.push({
            pathname: "/groups/[id]",
            params: { id: groupId }
          })}
          className="flex-row items-center flex-1 ml-2"
        >
          <View className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center">
            <Ionicons name="people" size={16} color="#1E9AFF" />
          </View>
          <View className="ml-2 flex-1">
            <Text className="text-base font-bold text-gray-900">
              {groupInfo?.name || 'Travel Group'}
            </Text>
            <Text className="text-xs text-gray-500">
              {groupInfo?.member_count || 0} members
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => setShowMembers(true)}
          className="p-2"
        >
          <Ionicons name="people" size={24} color="#1E9AFF" />
        </TouchableOpacity>
      </View>

      {/* Messages List */}
      <FlatList
        ref={messageListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.message_id}
        contentContainerStyle={[
          messages.length === 0 ? { flex: 1 } : { paddingVertical: 16 },
          { paddingBottom: 80 }
        ]}
        className="flex-1 bg-white"
        onContentSizeChange={() => messageListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Input Bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="border-t border-gray-100"
      >
        <View className="flex-row items-center p-2 bg-white">
          <TouchableOpacity 
            onPress={() => setShowCamera(true)}
            className="p-2"
          >
            <Ionicons name="camera" size={28} color="#1E9AFF" />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center bg-gray-100 rounded-full mx-2 px-4 py-2">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Send to group"
              className="flex-1 text-base text-gray-900"
              multiline
              maxLength={1000}
            />
            
            <TouchableOpacity>
              <Ionicons name="happy" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {newMessage.trim() ? (
            <TouchableOpacity
              onPress={() => {
                if (newMessage.trim()) {
                  sendGroupMessage(newMessage.trim(), groupId);
                  setNewMessage('');
                }
              }}
              className="w-10 h-10 rounded-full bg-blue-500 items-center justify-center"
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity className="p-2">
              <Ionicons name="image" size={28} color="#1E9AFF" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* Members Modal */}
      {showMembers && renderMembersModal()}

      {/* Camera Overlay */}
      {showCamera && renderCameraView()}
    </SafeAreaView>
  );
} 