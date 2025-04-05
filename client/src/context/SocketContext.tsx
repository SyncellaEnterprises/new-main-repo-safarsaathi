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
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [socketConfig, setSocketConfig] = useState({
    host: '10.0.2.2',
    port: 5001
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
          const fallbackResponse = await axios.get('http://10.0.2.2:5001/api/socket/info', {
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

      newSocket.on('connection_status', (status: { status: string; message?: string }) => {
        console.log('Connection status:', status);
      });

      newSocket.on('error', (error: { message: string }) => {
        console.error('Socket error:', error.message);
      });

      // Listen for new messages
      newSocket.on('new_message', (message: any) => {
        console.log('New message received:', message);
        // To be handled by the chat screen component
      });

      // Listen for message status updates
      newSocket.on('message_status', (status: { message_id: string; status: string }) => {
        console.log('Message status update:', status);
        // To be handled by the chat screen component
      });

      // Listen for typing status
      newSocket.on('typing_status', (status: { user_id: string; is_typing: boolean }) => {
        console.log('Typing status:', status);
        // To be handled by the chat screen component
      });

      // Listen for user status updates
      newSocket.on('user_status', (status: { user_id: string; status: 'online' | 'offline' }) => {
        console.log('User status update:', status);
        // To be handled by the chat screen component
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Socket connection failed:', error);
      setIsConnecting(false);
    }
  };

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
      sendTypingStatus
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext); 