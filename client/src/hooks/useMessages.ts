import { useState, useEffect } from 'react';
import { userAPI } from '@/lib/api/user';
import { useSocket } from './useSocket';
import { MOCK_MESSAGES } from '@/constants/mockData';

export interface Message {
  id: string;
  type: 'text' | 'image' | 'audio' | 'document';
  content: string;
  senderId: string;
  receiverId: string;
  timestamp: string;
  reactions?: string[];
  isRead?: boolean;
  status?: string;
}

export function useMessages(chatId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [messageQueue, setMessageQueue] = useState<Message[]>([]);
  const [failedMessages, setFailedMessages] = useState<Message[]>([]);
  const { socket, isConnected } = useSocket();

  useEffect(() => {
    fetchMessages();
    markAsRead();

    if (socket) {
      socket.on('message:new', handleNewMessage);
      socket.on('message:delete', handleDeleteMessage);
      socket.on('message:update', handleUpdateMessage);
      socket.on('message:reaction', handleReaction);
      socket.on('message:read', handleMessageRead);
    }

    return () => {
      if (socket) {
        socket.off('message:new');
        socket.off('message:delete');
        socket.off('message:update');
        socket.off('message:reaction');
        socket.off('message:read');
      }
    };
  }, [chatId, socket]);

  const handleNewMessage = (message: Message) => {
    if (message.senderId === chatId || message.receiverId === chatId) {
      setMessages(prev => [message, ...prev]);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
  };

  const handleUpdateMessage = (updatedMessage: Message) => {
    setMessages(prev => 
      prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
    );
  };

  const handleReaction = ({ messageId, reaction }: { messageId: string; reaction: string }) => {
    setMessages(prev => 
      prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions: [...(msg.reactions || []), reaction] }
          : msg
      )
    );
  };

  const handleMessageRead = (messageIds: string[]) => {
    setMessages(prev => 
      prev.map(msg => 
        messageIds.includes(msg.id) ? { ...msg, isRead: true } : msg
      )
    );
  };

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      const response = await userAPI.getMessages(chatId);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async () => {
    try {
      await userAPI.markMessagesAsRead(chatId);
      socket?.emit('message:read', { chatId });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (message: Message) => {
    // Add optimistic update
    const tempId = `temp-${Date.now()}`;
    const messageWithId = { ...message, id: tempId, status: 'sending' };
    
    setMessages(prev => [messageWithId, ...prev]);
    
    if (!isConnected) {
      // Queue message for later
      setMessageQueue(prev => [...prev, messageWithId]);
      return;
    }

    try {
      const response = await new Promise((resolve, reject) => {
        socket.emit('message:send', message, (ack: any) => {
          if (ack.error) reject(ack.error);
          else resolve(ack);
        });
        
        // Add timeout
        setTimeout(() => reject(new Error('Message send timeout')), 10000);
      });

      // Update message with server response
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, ...response, status: 'sent' } : msg
      ));
    } catch (error) {
      console.error('Failed to send message:', error);
      setFailedMessages(prev => [...prev, messageWithId]);
      setMessages(prev => prev.map(msg => 
        msg.id === tempId ? { ...msg, status: 'failed' } : msg
      ));
    }
  };

  // Process queued messages when connection is restored
  useEffect(() => {
    if (isConnected && messageQueue.length > 0) {
      messageQueue.forEach(message => {
        sendMessage(message);
      });
      setMessageQueue([]);
    }
  }, [isConnected, messageQueue]);

  // Add retry mechanism for failed messages
  const retryMessage = (messageId: string) => {
    const message = failedMessages.find(msg => msg.id === messageId);
    if (message) {
      setFailedMessages(prev => prev.filter(msg => msg.id !== messageId));
      sendMessage(message);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await userAPI.deleteMessage(messageId);
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  };

  const editMessage = async (messageId: string, newContent: string) => {
    try {
      const response = await userAPI.updateMessage(messageId, { content: newContent });
      setMessages(prev => prev.map(msg => 
        msg.id === messageId ? response.data : msg
      ));
      return true;
    } catch (error) {
      console.error('Error editing message:', error);
      return false;
    }
  };

  const sendReaction = async (messageId: string, reaction: string) => {
    try {
      await userAPI.addReaction(messageId, reaction);
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, reactions: [...(msg.reactions || []), reaction] }
          : msg
      ));
      return true;
    } catch (error) {
      console.error('Error sending reaction:', error);
      return false;
    }
  };

  const loadMoreMessages = async () => {
    if (isLoading || messages.length === 0) return;
    
    try {
      const lastMessageId = messages[messages.length - 1].id;
      const response = await userAPI.getMessages(chatId, { before: lastMessageId });
      setMessages(prev => [...prev, ...response.data]);
    } catch (error) {
      console.error('Error loading more messages:', error);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    deleteMessage,
    editMessage,
    sendReaction,
    loadMoreMessages,
    markAsRead,
    messageQueue,
    failedMessages,
    retryMessage
  };
} 