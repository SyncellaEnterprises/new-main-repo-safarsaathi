import { useState, useEffect } from 'react';
import { userAPI } from '@/lib/api/user';

export function useChatRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getChatRequests();
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching chat requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (requestId: string) => {
    try {
      await userAPI.acceptChatRequest(requestId);
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error accepting chat request:', error);
    }
  };

  const declineRequest = async (requestId: string) => {
    try {
      await userAPI.declineChatRequest(requestId);
      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error('Error declining chat request:', error);
    }
  };

  return {
    requests,
    loading,
    acceptRequest,
    declineRequest,
    refetchRequests: fetchRequests,
  };
} 