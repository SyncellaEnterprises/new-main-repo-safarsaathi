import React, { createContext, useContext, useState } from 'react';
import axios from 'axios';
import { Platform } from 'react-native';

// API URL configuration
const API_URL = __DEV__ 
  ? Platform.select({
    ios: 'http://localhost:5000/api/user',
    android: 'http://10.0.2.2:5000/api/user',
  })
  : 'http://192.168.0.108:5000/api/user';

interface User {
  id: string;
  username: string;
  email: string;
  // Add other user fields as needed
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (username: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

interface AuthResponse {
  status: string;
  message: string;
  access_token: string;
  user: User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/login`, {
        email,
        password
      });

      if (response.data.status === 'success') {
        setAccessToken(response.data.access_token);
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sign in error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (username: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/register`, {
        username,
        email,
        password,
        confirmPassword: password
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.status === 'success') {
        setAccessToken(response.data.access_token);
        setUser(response.data.user);
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Sign up error:', {
        message: error.message,
        response: error.response?.data
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      if (accessToken) {
        await axios.post(`${API_URL}/logout`, {}, {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        });
      }
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setAccessToken(null);
      setUser(null);
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      signIn,
      signUp,
      signOut,
      isLoading
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 