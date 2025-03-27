import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => void;
  disconnect: () => void;
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  isConnecting: true,
  connect: () => {},
  disconnect: () => {},
});

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  const connect = async () => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        setIsConnecting(false);
        return;
      }

      const newSocket = io('http://10.0.2.2:4000', {
        transports: ['websocket'],
        auth: {
          token: await AsyncStorage.getItem('accessToken')
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        setIsConnected(true);
        setIsConnecting(false);
      });

      newSocket.on('disconnect', (reason: string ) => {
        setIsConnected(false);
        console.log('Socket disconnected:', reason);
      });

      newSocket.on('connect_error', (error: any) => {
        console.error('Connection error:', error);
        setIsConnecting(false);
      });

      newSocket.on('connection_status', (status: { status: string }) => {
        console.log('Connection status:', status);
      });

      newSocket.on('message_error', (error: { error: string }) => {
        console.error('Message error:', error);
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

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ 
      socket, 
      isConnected,
      isConnecting,
      connect, 
      disconnect 
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext); 