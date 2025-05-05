import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  Image, 
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSocket } from '@/src/context/SocketContext';
import { useAuth } from '@/src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, { FadeIn, SlideInRight } from 'react-native-reanimated';

interface Message {
  message_id: string;
  content: string;
  sender_id: string;
  sender_name: string;
  receiver_id: string;
  sent_at: string;
  type: 'text' | 'image' | 'video';
  status: 'sent' | 'delivered' | 'read';
}

interface Recipient {
  id: string;
  username: string;
  profile_photo: string | null;
  isOnline: boolean;
}

// Add this helper function right before the ChatDetailScreen component
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

export default function ChatDetailScreen() {
  const { id } = useLocalSearchParams();
  const { socket, isConnected, isConnecting, joinChat, sendMessage, readMessage, sendTypingStatus } = useSocket();
  const { user } = useAuth();
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [recipient, setRecipient] = useState<Recipient>({ 
    id: String(id), 
    username: 'Loading...', 
    profile_photo: null,
    isOnline: false 
  });
  const [isLoading, setIsLoading] = useState(true);
  const typingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Join the chat when connected
  useEffect(() => {
    if (isConnected && id) {
      joinChat(String(id));
    }
  }, [isConnected, id, joinChat]);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    // Handler for when successfully joined a chat
    const handleChatJoined = (data: {
      room_id: string;
      recipient: Recipient;
      is_online: boolean;
      messages: Message[];
    }) => {
      console.log('Chat joined with data:', JSON.stringify(data));
      
      // Validate recipient data
      const recipientData = data.recipient || { 
        id: String(id), 
        username: 'User', 
        profile_photo: null,
        isOnline: false 
      };
      
      // Validate messages array
      const validMessages = Array.isArray(data.messages) 
        ? data.messages.filter(msg => msg && typeof msg === 'object')
        : [];
      
      console.log(`Received ${validMessages.length} valid messages`);
      
      setRecipient({
        ...recipientData,
        isOnline: data.is_online
      });
      setMessages(validMessages);
      setIsLoading(false);

      // Scroll to bottom after loading messages
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: false });
      }, 300);
    };

    // Handler for new messages
    const handleNewMessage = (message: Message) => {
      console.log('New message received:', JSON.stringify(message));
      
      // Validate the message object
      if (!message || typeof message !== 'object') {
        console.warn('Received invalid message object');
        return;
      }
      
      setMessages(prev => [...prev, message]);
      
      // If the message is from the other user, mark it as read
      if (message.sender_id === String(id)) {
        readMessage(message.message_id);
      }

      // Scroll to bottom on new message
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    };

    // Handler for message status updates
    const handleMessageStatus = (data: { message_id: string; status: string }) => {
      setMessages(prev => 
        prev.map(msg => 
          msg.message_id === data.message_id 
            ? { ...msg, status: data.status as 'sent' | 'delivered' | 'read' } 
            : msg
        )
      );
    };

    // Handler for typing status
    const handleTypingStatus = (data: { user_id: string; is_typing: boolean }) => {
      if (data.user_id === String(id)) {
        setIsTyping(data.is_typing);
      }
    };

    // Handler for user status
    const handleUserStatus = (data: { user_id: string; status: 'online' | 'offline' }) => {
      if (data.user_id === String(id)) {
        setRecipient(prev => ({
          ...prev,
          isOnline: data.status === 'online'
        }));
      }
    };

    // Set up event listeners
    socket.on('chat_joined', handleChatJoined);
    socket.on('new_message', handleNewMessage);
    socket.on('message_status', handleMessageStatus);
    socket.on('typing_status', handleTypingStatus);
    socket.on('user_status', handleUserStatus);

    // Clean up event listeners
    return () => {
      socket.off('chat_joined', handleChatJoined);
      socket.off('new_message', handleNewMessage);
      socket.off('message_status', handleMessageStatus);
      socket.off('typing_status', handleTypingStatus);
      socket.off('user_status', handleUserStatus);
    };
  }, [socket, id, readMessage, user]);

  // Handle sending a message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !isConnected) return;

    sendMessage(newMessage.trim(), String(id));
    setNewMessage('');
    
    // Cancel typing indicator when sending
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = null;
      sendTypingStatus(String(id), false);
    }

    // Scroll to bottom
    scrollViewRef.current?.scrollToEnd({ animated: true });
  };

  // Handle typing indicators
  const handleTyping = (text: string) => {
    setNewMessage(text);
    
    // Send typing indicator when user starts typing
    if (!typingTimerRef.current && text.length > 0) {
      sendTypingStatus(String(id), true);
    }
    
    // Clear previous timer
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    
    // Set a new timer to stop typing indicator after 3 seconds of inactivity
    typingTimerRef.current = setTimeout(() => {
      sendTypingStatus(String(id), false);
      typingTimerRef.current = null;
    }, 3000);
  };

  // Format message time
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

  // Loading state
  if (isConnecting || isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Connecting...</Text>
      </View>
    );
  }

  if (!isConnected) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="wifi-outline" size={64} color="#8E8E93" />
        <Text style={styles.loadingText}>Connection lost. Reconnecting...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#007AFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => {
            // Simple navigation to avoid router type issues
            if (recipient && recipient.id) {
              // Just navigate back for now to avoid the router type error
              router.back();
            }
          }}
          style={styles.headerProfile}
        >
          {recipient.profile_photo ? (
            <Image
              source={{ uri: recipient.profile_photo }}
              style={styles.profileImage}
            />
          ) : (
            <ProfileInitials 
              username={recipient.username} 
              size={36} 
              textSize={16} 
              backgroundColor="#5856D6"
            />
          )}
          {recipient.isOnline && (
            <View style={styles.onlineIndicator} />
          )}
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{recipient.username}</Text>
            <Text style={styles.headerStatus}>
              {recipient.isOnline ? (isTyping ? 'typing...' : 'online') : 'offline'}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageScrollContent}
      >
        {messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="chatbubbles-outline" size={40} color="#007AFF" />
            </View>
            <Text style={styles.emptyTitle}>Start Chatting</Text>
            <Text style={styles.emptySubtitle}>
              Send a message to begin your conversation
            </Text>
          </View>
        ) : (
          (() => {
            let currentDateHeader = '';
            let messageGroups: JSX.Element[] = [];
            
            messages.forEach((message) => {
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
              
              const isOwnMessage = message.sender_id === user?.id;
              messageGroups.push(
                <Animated.View
                  key={message.message_id}
                  entering={FadeIn}
                  style={[
                    styles.messageContainer,
                    isOwnMessage ? styles.ownMessage : styles.otherMessage
                  ]}
                >
                  {!isOwnMessage && (
                    <View style={styles.messageSender}>
                      {recipient.profile_photo ? (
                        <Image
                          source={{ uri: recipient.profile_photo }}
                          style={styles.messageAvatar}
                        />
                      ) : (
                        <ProfileInitials 
                          username={message.sender_name || recipient.username} 
                          size={28} 
                          textSize={12} 
                          backgroundColor="#5856D6"
                        />
                      )}
                    </View>
                  )}
                  <View style={styles.messageContent}>
                    {!isOwnMessage && (
                      <Text style={styles.senderName}>
                        {message.sender_name || recipient.username}
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
                    <View style={styles.messageFooter}>
                      <Text style={styles.messageTime}>
                        {formatMessageTime(message.sent_at)}
                      </Text>
                      {isOwnMessage && (
                        <Ionicons 
                          name={
                            message.status === 'read' 
                              ? 'checkmark-done' 
                              : message.status === 'delivered' 
                                ? 'checkmark-done' 
                                : 'checkmark'
                          } 
                          size={16} 
                          color={message.status === 'read' ? '#007AFF' : '#8E8E93'} 
                        />
                      )}
                    </View>
                  </View>
                </Animated.View>
              );
            });
            
            return messageGroups;
          })()
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputWrapper}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle-outline" size={24} color="#8E8E93" />
          </TouchableOpacity>

          <TextInput
            value={newMessage}
            onChangeText={handleTyping}
            placeholder="Message"
            style={styles.input}
            multiline
            maxLength={1000}
          />

          {newMessage.trim() ? (
            <TouchableOpacity 
              style={styles.sendButton}
              onPress={handleSendMessage}
            >
              <Ionicons name="send" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micButton}>
              <Ionicons name="mic" size={24} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButton: {
    padding: 8,
  },
  headerProfile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
    position: 'relative',
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
  },
  onlineIndicator: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CD964',
    borderWidth: 2,
    borderColor: 'white',
    bottom: 0,
    left: 26,
  },
  headerInfo: {
    marginLeft: 12,
  },
  headerName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  headerStatus: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  menuButton: {
    padding: 8,
  },
  messageList: {
    flex: 1,
  },
  messageScrollContent: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#8E8E93',
    textAlign: 'center',
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '90%',
  },
  ownMessage: {
    alignSelf: 'flex-end',
    justifyContent: 'flex-end',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    justifyContent: 'flex-start',
  },
  messageSender: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E5EA',
  },
  messageContent: {
    flexDirection: 'column',
    maxWidth: '80%',
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
    lineHeight: 20,
  },
  ownMessageText: {
    color: '#FFFFFF',
  },
  otherMessageText: {
    color: '#000000',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    paddingHorizontal: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#8E8E93',
    marginRight: 4,
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F2F2F7',
    backgroundColor: '#FFFFFF',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    marginHorizontal: 12,
    maxHeight: 100,
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 20,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    padding: 8,
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
});
