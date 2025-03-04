import { useState, useEffect } from 'react';
import { userAPI } from '@/lib/api/user';
import { useSocket } from './useSocket';

export interface Chat {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isOnline: boolean;
  isPinned?: boolean;
  isBlocked?: boolean;
}

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { socket } = useSocket();

  useEffect(() => {
    fetchChats();
    
    if (socket) {
      socket.on('message:new', handleNewMessage);
      socket.on('user:online', handleUserOnline);
      socket.on('user:offline', handleUserOffline);
    }

    return () => {
      if (socket) {
        socket.off('message:new');
        socket.off('user:online');
        socket.off('user:offline');
      }
    };
  }, [socket]);

  const fetchChats = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getChats();
      setChats(response.data);
    } catch (error) {
      console.error('Error fetching chats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewMessage = (message: any) => {
    setChats(prev => prev.map(chat => {
      if (chat.id === message.chatId) {
        return {
          ...chat,
          lastMessage: message.text,
          timestamp: message.timestamp,
          unreadCount: chat.unreadCount + 1
        };
      }
      return chat;
    }));
  };

  const handleUserOnline = (userId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === userId ? { ...chat, isOnline: true } : chat
    ));
  };

  const handleUserOffline = (userId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === userId ? { ...chat, isOnline: false } : chat
    ));
  };

  const pinChat = async (chatId: string) => {
    try {
      await userAPI.pinChat(chatId);
      setChats(prev => prev.map(chat => 
        chat.id === chatId ? { ...chat, isPinned: true } : chat
      ));
    } catch (error) {
      console.error('Error pinning chat:', error);
    }
  };

  const blockUser = async (userId: string) => {
    try {
      await userAPI.blockUser(userId);
      setChats(prev => prev.map(chat => 
        chat.id === userId ? { ...chat, isBlocked: true } : chat
      ));
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  return {
    chats,
    isLoading,
    refetchChats: fetchChats,
    pinChat,
    blockUser
  };
} 