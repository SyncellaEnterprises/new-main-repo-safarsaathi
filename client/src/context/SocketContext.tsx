import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

interface SocketContextType {
  socket: any;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
  joinChat: (otherId: string) => void;
  sendMessage: (content: string, receiverId: string, type?: string) => void;
  readMessage: (messageId: string) => void;
  sendTypingStatus: (receiverId: string, isTyping: boolean) => void;
  // Group chat methods
  joinGroupChat: (groupId: string) => void;
  sendGroupMessage: (content: string, groupId: string, type?: string) => void;
  sendGroupTypingStatus: (groupId: string, isTyping: boolean) => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isConnecting: true,
  connect: () => {},
  disconnect: () => {},
  joinChat: () => {},
  sendMessage: () => {},
  readMessage: () => {},
  sendTypingStatus: () => {},
  // Group chat methods
  joinGroupChat: () => {},
  sendGroupMessage: () => {},
  sendGroupTypingStatus: () => {},
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [socketConfig, setSocketConfig] = useState({
    host: '10.0.2.2',
    port: 5002
  });

  // Fetch socket server configuration
  useEffect(() => {
    const fetchSocketConfig = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (!token) {
          console.log('No access token available for socket configuration');
          return;
        }

        console.log('Fetching socket configuration from API...');
        
        // Try fetching from main API first
        try {
          const response = await axios.get('http://10.0.2.2:5000/api/socket/info', {
            headers: { Authorization: `Bearer ${token}` },
            timeout: 5000 // 5 second timeout
          });
          
          if (response.data && response.data.socket_port) {
            console.log(`Socket config received from main API: port=${response.data.socket_port}, host=${response.data.socket_host || '10.0.2.2'}`);
            setSocketConfig({
              host: response.data.socket_host || '10.0.2.2',
              port: response.data.socket_port
            });
            return; // Successfully got config from main API
          }
        } catch (mainApiError: any) {
          console.warn('Failed to fetch socket config from main API:', mainApiError.message);
          // Continue to fallback
        }
        
        // Fallback: try to get socket config directly from socket server
        try {
          console.log('Attempting to fetch config directly from socket server...');
          const fallbackResponse = await axios.get('http://10.0.2.2:5002/api/socket_server/info', {
            timeout: 3000
          });
          
          if (fallbackResponse.data && fallbackResponse.data.socket_port) {
            console.log(`Socket config received from socket server: port=${fallbackResponse.data.socket_port}, host=${fallbackResponse.data.socket_host || '10.0.2.2'}`);
            setSocketConfig({
              host: fallbackResponse.data.socket_host || '10.0.2.2',
              port: fallbackResponse.data.socket_port
            });
            return;
          }
        } catch (fallbackError: any) {
          console.warn('Failed to fetch socket config from socket server:', fallbackError.message);
        }
        
        // If we reach here, both attempts failed, use default values
        console.log(`Using default socket configuration: port=${socketConfig.port}, host=${socketConfig.host}`);
      } catch (error) {
        console.error('Socket config fetch error:', error);
        // Use default values set in state
        console.log(`Using default socket configuration: port=${socketConfig.port}, host=${socketConfig.host}`);
      }
    };

    // Try fetching socket config immediately and then every 30 seconds if needed
    fetchSocketConfig();
    const intervalId = setInterval(fetchSocketConfig, 30000);
    
    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  const connect = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        setIsConnecting(false);
        return;
      }

      // Use the dynamically fetched socket server config
      const socketUrl = `http://${socketConfig.host}:${socketConfig.port}`;
      console.log(`Connecting to socket server at: ${socketUrl}`);

      // Connect to socket server with token as query parameter
      const newSocket = io(socketUrl, {
        transports: ['websocket'],
        query: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      // Set up basic connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        setIsConnecting(false);
      });

      newSocket.on('disconnect', (reason: string) => {
        setIsConnected(false);
        console.log('Socket disconnected:', reason);
      });

      newSocket.on('connect_error', (error: any) => {
        console.error('Connection error:', error);
        setIsConnecting(false);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Socket connection failed:', error);
      setIsConnecting(false);
    }
  };

  // Set up all the socket event listeners when socket changes
  useEffect(() => {
    if (!socket) return;

    // Connection status events
    socket.on('connection_status', (status: { status: string; message?: string }) => {
      console.log('Connection status:', status);
    });

    socket.on('error', (error: { message: string }) => {
      console.error('Socket error:', error.message);
    });

    // Direct chat events
    socket.on('chat_joined', (data: any) => {
      console.log('Chat joined:', data);
    });

    socket.on('new_message', (message: any) => {
      console.log('New message received:', message);
    });

    socket.on('message_status', (status: { message_id: string; status: string }) => {
      console.log('Message status update:', status);
    });

    socket.on('typing_status', (status: { user_id: string; is_typing: boolean }) => {
      console.log('Typing status:', status);
    });

    socket.on('user_status', (status: { user_id: string; status: 'online' | 'offline' }) => {
      console.log('User status update:', status);
    });

    // Group chat events
    socket.on('group_chat_joined', (data: { group_id: string; online_members: string[] }) => {
      console.log('Group chat joined:', data);
    });

    socket.on('new_group_message', (message: any) => {
      console.log('New group message received:', message);
    });

    socket.on('group_member_status', (status: { group_id: string; user_id: string; status: 'online' | 'offline' }) => {
      console.log('Group member status update:', status);
    });

    socket.on('group_typing_status', (status: { group_id: string; user_id: string; username: string; is_typing: boolean }) => {
      console.log('Group typing status:', status);
    });

    return () => {
      // Clean up all listeners
      socket.off('connection_status');
      socket.off('error');
      socket.off('chat_joined');
      socket.off('new_message');
      socket.off('message_status');
      socket.off('typing_status');
      socket.off('user_status');
      socket.off('group_chat_joined');
      socket.off('new_group_message');
      socket.off('group_member_status');
      socket.off('group_typing_status');
    };
  }, [socket]);

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
    }
  };

  // Join a chat room with another user
  const joinChat = (otherId: string) => {
    if (!socket || !isConnected) return;
    
    socket.emit('join_chat', { other_user_id: otherId });
    console.log('Joining chat with user:', otherId);
  };

  // Send a message to another user
  const sendMessage = (content: string, receiverId: string, type: string = 'text') => {
    if (!socket || !isConnected) return;
    
    socket.emit('send_message', {
      content,
      receiver_id: receiverId,
      type
    });
    console.log('Sending message to user:', receiverId);
  };

  // Mark a message as read
  const readMessage = (messageId: string) => {
    if (!socket || !isConnected) return;
    
    socket.emit('message_read', { message_id: messageId });
    console.log('Marking message as read:', messageId);
  };

  // Send typing status
  const sendTypingStatus = (receiverId: string, isTyping: boolean) => {
    if (!socket || !isConnected) return;
    
    socket.emit('typing', {
      receiver_id: receiverId,
      is_typing: isTyping
    });
    console.log('Sending typing status to user:', receiverId, isTyping);
  };

  // Join a group chat
  const joinGroupChat = (groupId: string) => {
    if (!socket || !isConnected) return;
    
    socket.emit('join_group_chat', { group_id: groupId });
    console.log('Joining group chat:', groupId);
  };

  // Send a message to a group
  const sendGroupMessage = (content: string, groupId: string, type: string = 'text') => {
    if (!socket || !isConnected) return;
    
    socket.emit('group_message', {
      message: content,
      group_id: groupId,
      type: type
    });
    console.log('Sending group message to group:', groupId);
  };

  // Send typing status to a group
  const sendGroupTypingStatus = (groupId: string, isTyping: boolean) => {
    if (!socket || !isConnected) return;
    
    socket.emit('group_typing', {
      group_id: groupId,
      is_typing: isTyping
    });
    console.log('Sending group typing status to group:', groupId, isTyping);
  };

  // Connect socket when the configuration is ready
  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [socketConfig]); // Reconnect when socket config changes

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected,
      isConnecting,
      connect, 
      disconnect,
      joinChat,
      sendMessage,
      readMessage,
      sendTypingStatus,
      // Group chat methods
      joinGroupChat,
      sendGroupMessage,
      sendGroupTypingStatus
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext); 