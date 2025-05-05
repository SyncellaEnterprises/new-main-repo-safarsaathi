import * as FileSystem from 'expo-file-system';
import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';

const API_URL = __DEV__ 
  ? Platform.select({
    ios: 'http://localhost:5000/api/onboarding',
    android: 'http://10.0.2.2:5000/api/onboarding',
  })
  : 'http://192.168.0.108:5000/api/onboarding';

interface OnboardingContextType {
  updateAge: (age: number) => Promise<boolean>;
  updateGender: (gender: string) => Promise<boolean>;
  updateLocation: (location: string) => Promise<boolean>;
  updateOccupation: (occupation: string) => Promise<boolean>;
  updateInterests: (interests: string[]) => Promise<boolean>;
  updateBio: (bio: string) => Promise<boolean>;
  updatePrompts: (prompts: { question: string; answer: string }[]) => Promise<boolean>;
  updatePhotos: (photos: string[]) => Promise<boolean>;
  isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { accessToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const headers = {
    'Authorization': `Bearer ${accessToken}`,
    'Content-Type': 'application/json'
  };

  const updateAge = async (age: number): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/age`, { age }, { headers });
      return response.data.status === 'success';
    } catch (error) {
      console.error('Update age error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateGender = async (gender: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/gender`, { 
        gender : gender.toLowerCase()
       }, { headers });
      return response.data.status === 'success';
    } catch (error: any) {
      console.error('Update gender error:', {
        message: error.message,
        response: error.response?.data
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateLocation = async (location: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/location`, { location }, { headers });
      return response.data.status === 'success';
    } catch (error) {
      console.error('Update location error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateOccupation = async (occupation: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/occupation`, { occupation }, { headers });
      return response.data.status === 'success';
    } catch (error) {
      console.error('Update occupation error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateInterests = async (interests: string[]): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/interests`, { interests }, { headers });
      return response.data.status === 'success';
    } catch (error) {
      console.error('Update interests error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updateBio = async (bio: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/bio`, { bio }, { headers });
      return response.data.status === 'success';
    } catch (error) {
      console.error('Update bio error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePrompts = async (prompts: { question: string; answer: string }[]): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/prompts`, { 
        prompts: prompts.map(p => ({
          question: p.question,
          answer: p.answer.trim()
        }))
      }, { headers });
      console.log('Update prompts response:', response.data);
      return response.data.status === 'success';

    } catch (error: any) {
      console.error('Update prompts error:', {
        message: error.message,
        response: error.response?.data
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePhotos = async (photos: string[]): Promise<boolean> => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      
      photos.forEach((uri, index) => {
        const filename = uri.split('/').pop() || `photo${index}.jpg`;
        // Get file extension and validate
        const match = /\.(\w+)$/.exec(filename);
        const ext = match ? match[1].toLowerCase() : 'jpg';
        
        // Set proper mime type for supported formats
        let type = 'image/jpeg';
        if (ext === 'png') type = 'image/png';
        if (ext === 'jpg' || ext === 'jpeg') type = 'image/jpeg';
        
        formData.append('images', {
          uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
          type: type,
          name: filename,
        } as any);
      });

      // Log the FormData for debugging
      console.log('Uploading photos:', {
        numberOfPhotos: photos.length,
        formData: JSON.stringify(formData)
      });

      const response = await axios.post(`${API_URL}/images`, formData, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
          'Accept': 'application/json',
        },
        transformRequest: (data, headers) => {
          return formData; // Prevent axios from trying to transform FormData
        },
        timeout: 30000, // Increase timeout for large uploads
      });

      console.log('Photo upload response:', response.data);
      return response.data.status === 'success';
    } catch (error: any) {
      console.error('Update photos error:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OnboardingContext.Provider value={{
      updateAge,
      updateGender,
      updateLocation,
      updateOccupation,
      updateInterests,
      updateBio,
      updatePrompts,
      updatePhotos,
      isLoading
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}; 