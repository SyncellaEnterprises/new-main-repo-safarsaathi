import { useState, useEffect } from 'react';
import { userAPI } from '@/lib/api/user';

export function useUser(userId: string) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await userAPI.getUser(userId);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading };
} 