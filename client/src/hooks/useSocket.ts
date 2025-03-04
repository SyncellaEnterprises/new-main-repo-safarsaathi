import { useEffect, useState } from 'react';
import { socket } from '@/lib/socket'
import { useAuth } from '@/context/AuthContext';


export function useSocket() {
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastPing, setLastPing] = useState<Date | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { token } = useAuth();

  useEffect(() => {
    if (token && !socket.connected) {
      socket.auth = { token };
      socket.connect();
    }

    function onConnect() {
      setIsConnected(true);
      setConnectionAttempts(0);
    }

    function onDisconnect(reason: string) {
      setIsConnected(false);
      console.warn('Socket disconnected:', reason);
      
      // Handle specific disconnect reasons
      if (reason === 'io server disconnect') {
        // Server forcefully disconnected, maybe token expired
        // Trigger reauth flow
      }
    }

    function onError(error: Error) {
      console.error('Socket error:', error);
      setConnectionAttempts(prev => prev + 1);
    }

    function onPong() {
      setLastPing(new Date());
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('error', onError);
    socket.on('pong', onPong);

    // Cleanup
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('error', onError);
      socket.off('pong', onPong);
    };
  }, [token]);

  // Monitor connection health
  useEffect(() => {
    if (lastPing && Date.now() - lastPing.getTime() > 60000) {
      // No ping response for 1 minute, connection might be stale
      socket.disconnect();
      socket.connect();
    }
  }, [lastPing]);

  return {
    socket,
    isConnected,
    connectionAttempts,
    lastPing
  };
} 