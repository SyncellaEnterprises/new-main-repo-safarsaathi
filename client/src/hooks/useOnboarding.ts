import { useState } from 'react';
import { userAPI } from '@/lib/api/user';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';

export function useOnboarding() {
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuth();
  const toast = useToast();

  const saveInterests = async (interests: string[]) => {
    try {
      setLoading(true);
      const updatedProfile = await userAPI.updateProfile({ interests });
      updateUser({ ...user, interests });
      return true;
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to save interests', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const savePrompts = async (prompts: Array<{ id: string; question: string; answer: string }>) => {
    try {
      setLoading(true);
      const updatedProfile = await userAPI.updateProfile({ prompts });
      updateUser({ ...user, prompts });
      return true;
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to save prompts', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    saveInterests,
    savePrompts,
  };
} 