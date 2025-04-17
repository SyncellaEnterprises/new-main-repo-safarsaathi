import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, SafeAreaView, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSocket } from '@/src/context/SocketContext';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';
import Animated, { FadeIn } from 'react-native-reanimated';

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
  const messageListRef = useRef<FlatList>(null);

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

  // Render message items
  const renderMessage = ({ item }: { item: GroupMessage }) => {
    // Add null checks to prevent TypeError
    if (!item || !user) {
      return null;
    }
    
    // Get the sender ID to check if we need to show the name
    const senderId = String(item.sender_id || '');
    const userId = String(user.id || '');
    const isOwnMessage = senderId === userId;
    
    return (
      <Animated.View 
        entering={FadeIn}
        className={`flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-2 px-4`}
      >
        {!isOwnMessage && (
          <Image
            source={{ 
              uri: groupInfo?.members.find(m => String(m.user_id) === senderId)?.profile_photo || 
                  'https://via.placeholder.com/400x400?text=No+Profile+Image'
            }}
            className="h-8 w-8 rounded-full mr-2 mt-1"
          />
        )}
        <View className={`max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          <View 
            className={`rounded-2xl px-4 py-2.5 shadow-sm ${
              isOwnMessage 
                ? 'rounded-tr-sm bg-gradient-romance ml-auto' 
                : 'rounded-tl-sm bg-white mr-auto'
            }`}
          >
            {!isOwnMessage && (
              <Text className="text-primary-dark text-xs font-montserratMedium mb-1">
                {item.sender_name}
              </Text>
            )}
            <Text className={`${isOwnMessage ? 'text-white' : 'text-neutral-darkest'} font-montserrat`}>
              {item.content || ''}
            </Text>
          </View>
          <View className={`flex-row items-center mt-1 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
            <Text className="text-xs text-neutral-dark font-montserrat">
              {formatMessageTime(item.sent_at || new Date().toISOString())}
            </Text>
          </View>
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

  // Show loading state
  if (isConnecting || isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-neutral-light">
        <ActivityIndicator size="large" color="#7D5BA6" />
        <Text className="mt-4 text-center text-neutral-dark font-montserrat">
          Loading group chat...
        </Text>
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
    <View className={`absolute inset-0 bg-black/50 ${showMembers ? 'flex' : 'hidden'}`}>
      <View className="bg-white m-4 rounded-2xl max-h-[80%] mt-24">
        <View className="p-4 border-b border-neutral-medium flex-row justify-between items-center">
          <Text className="text-xl font-montserratBold text-neutral-darkest">
            Group Members ({groupInfo?.members?.length || 0})
          </Text>
          <TouchableOpacity onPress={() => setShowMembers(false)}>
            <Ionicons name="close" size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>
        
        <ScrollView className="p-4">
          {groupInfo?.members?.map(member => (
            <View 
              key={member.user_id} 
              className="flex-row items-center p-3 border-b border-neutral-light"
            >
              <Image 
                source={{ 
                  uri: member.profile_photo || 'https://via.placeholder.com/400x400?text=User'
                }}
                className="w-12 h-12 rounded-full"
              />
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <Text className="text-base font-montserratMedium text-neutral-darkest">
                    {member.username}
                  </Text>
                  {member.is_admin && (
                    <View className="ml-2 px-2 py-0.5 bg-primary/20 rounded-full">
                      <Text className="text-xs text-primary font-montserratMedium">Admin</Text>
                    </View>
                  )}
                </View>
                <Text className="text-sm text-neutral-dark font-montserrat">
                  {onlineMembers.has(String(member.user_id)) ? 'Online' : 'Offline'}
                </Text>
              </View>
              {String(member.user_id) !== String(user?.id) && (
                <TouchableOpacity 
                  className="p-2"
                  onPress={() => handleMemberChatPress(member)}
                >
                  <Ionicons name="chatbubbles-outline" size={20} color="#7D5BA6" />
                </TouchableOpacity>
              )}
            </View>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  // Handle navigation to direct chat with a group member
  const handleMemberChatPress = (member: GroupMember) => {
    // Close the members modal
    setShowMembers(false);
    
    // Navigate to the individual chat with this member
    router.push(`/chat/${member.user_id}`);
    
    // Log the navigation
    console.log(`Navigating to chat with member: ${member.username} (ID: ${member.user_id})`);
  };

  return (
    <SafeAreaView className="flex-1 bg-neutral-light">
      {/* Header */}
      <LinearGradient
        colors={['rgba(125, 91, 166, 0.9)', 'rgba(90, 65, 128, 0.8)']}
        className="px-4 py-3"
      >
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          <View className="h-10 w-10 rounded-full bg-secondary items-center justify-center">
            <Ionicons name="people" size={20} color="white" />
          </View>
          
          <View className="flex-1 ml-3">
            <Text className="text-white text-lg font-montserratMedium">
              {groupInfo?.name || 'Travel Group'}
            </Text>
            <Text className="text-primary-light text-sm font-montserrat">
              {groupInfo?.destination || ''} {formatDateRange()}
            </Text>
          </View>

          <TouchableOpacity 
            onPress={() => setShowMembers(true)}
            className="bg-primary/30 p-2 rounded-full"
          >
            <Ionicons name="people" size={20} color="white" />
            <View className="absolute -top-1 -right-1 bg-secondary rounded-full min-w-5 h-5 items-center justify-center px-1">
              <Text className="text-xs text-white font-montserratBold">
                {groupInfo?.member_count || 0}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Group Info */}
      {groupInfo?.description && (
        <View className="bg-white p-4 border-b border-neutral-light">
          <Text className="text-sm text-neutral-dark font-montserrat">
            {groupInfo.description}
          </Text>
        </View>
      )}

      {/* Messages List */}
      <FlatList
        ref={messageListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.message_id}
        contentContainerStyle={messages.length === 0 ? { flex: 1 } : { paddingVertical: 16 }}
        ListEmptyComponent={renderEmptyMessages}
        inverted={false}
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => messageListRef.current?.scrollToEnd({ animated: false })}
      />

      {/* Message Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="border-t border-gray-200 bg-white"
      >
        <View className="flex-row items-center p-2">
          <TouchableOpacity className="p-2">
            <Ionicons name="add-circle-outline" size={24} color="#6B7280" />
          </TouchableOpacity>
          
          <View className="flex-1 flex-row items-center bg-gray-100 rounded-full px-4 py-2 mx-2">
            <TextInput
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Message..."
              className="flex-1 text-base text-gray-800 font-montserrat"
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity className="mr-2">
              <Ionicons name="camera-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Ionicons name="image-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSendMessage}
            className={`p-2 rounded-full ${newMessage.trim() ? 'bg-primary' : 'bg-neutral-medium'}`}
            disabled={!newMessage.trim() || !isConnected}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color="white" 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      
      {/* Members Modal */}
      {renderMembersModal()}
    </SafeAreaView>
  );
} 