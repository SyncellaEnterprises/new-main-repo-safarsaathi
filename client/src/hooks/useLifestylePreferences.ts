import { useState } from 'react';
import { useProfile } from '@/context/ProfileContext';
import { profileAPI } from '@/lib/api/profile';

export function useLifestylePreferences() {
  const { profile, updateProfile } = useProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePreferences = async (data: {
    budget?: number;
    drinking?: string;
    smoking?: string;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await profileAPI.updateLifestylePreferences(data);
      updateProfile({
        ...profile,
        lifestyle: {
          ...profile?.lifestyle,
          ...data
        }
      });
      return response;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    budget: profile?.lifestyle?.budget,
    drinking: profile?.lifestyle?.drinking,
    smoking: profile?.lifestyle?.smoking,
    isLoading,
    error,
    updatePreferences,
  };
} 