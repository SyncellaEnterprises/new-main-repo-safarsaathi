import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SocketContext = createContext<Socket | null>(null);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);

  const token = AsyncStorage.getItem('accessToken');
  console.log('token', token);
  useEffect(() => {
    if (token) {
      const newSocket = io(process.env.EXPO_PUBLIC_WS_URL!, {
        transports: ['websocket'],
        auth: {
          token: token
        },
        // query: {
        //   db_container_name: process.env.DB_CONTAINER_NAME
        // }
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [token]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext); 