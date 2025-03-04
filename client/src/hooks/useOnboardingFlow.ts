import { useState } from 'react';
import { useRouter } from 'expo-router';
import { userAPI } from '@/lib/api/user';
import { useToast } from '@/context/ToastContext';
import { useOnboardingContext } from '@/context/OnboardingContext';

export const ONBOARDING_STEPS = {
  age: '/onboarding/age',
  gender: '/onboarding/gender',
  location: '/onboarding/location',
  photos: '/onboarding/photos',
  bio: '/onboarding/bio',
  occupation: '/onboarding/occupation',
  interests: '/onboarding/interests',
  prompts: '/onboarding/prompts',
  lifestyle: '/onboarding/lifestyle-prompts',
} as const;

export function useOnboardingFlow() {
  const [loading, setLoading] = useState(false);
  const { data, updateData } = useOnboardingContext();
  const router = useRouter();
  const toast = useToast();

  const saveStep = async (step: string, data: any) => {
    try {
      setLoading(true);
      // Save each step to backend immediately
      await userAPI.updateProfile({ [step]: data });
      updateData({ [step]: data });
      return true;
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to save step', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const skipStep = (nextRoute: string) => {
    router.push(nextRoute);
  };

  const completeOnboarding = async (data: any) => {
    try {
      setLoading(true);
      // Send final data to backend
      await userAPI.completeOnboarding({
        ...data,
        lifestyle: {
          budget: data.budget,
          drinking: data.drinking,
          smoking: data.smoking
        },
        onboardingCompleted: true
      });
      return true;
    } catch (error: any) {
      toast.show(error.response?.data?.message || 'Failed to complete onboarding', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    saveStep,
    skipStep,
    completeOnboarding,
  };
} 