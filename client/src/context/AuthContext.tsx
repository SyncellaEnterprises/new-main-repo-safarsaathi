import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { jwtDecode } from 'jwt-decode';
import { useRouter } from 'expo-router';

// API URL configuration
const API_URL = __DEV__ 
  ? Platform.select({
    ios: 'http://localhost:5000/api/user',
    android: 'http://10.0.2.2:5000/api/user',
  })
  : 'http://192.168.0.108:5000/api/user';

// Token expiration time in hours
const TOKEN_EXPIRATION_HOURS = 24;

interface User {
  id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (username: string, email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isTokenValid: () => Promise<boolean>;
}

interface AuthResponse {
  status: string;
  message: string;
  access_token: string;
  user: User;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Setup axios interceptor for 401 responses
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await handleLogout();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  // Monitor token validity
  useEffect(() => {
    let tokenCheckInterval: NodeJS.Timeout;

    const checkTokenValidity = async () => {
      const isValid = await isTokenValid();
      if (!isValid) {
        await handleLogout();
      }
    };

    // Check token validity every minute
    tokenCheckInterval = setInterval(checkTokenValidity, 60 * 1000);

    // Initial check
    checkTokenValidity();

    return () => {
      if (tokenCheckInterval) {
        clearInterval(tokenCheckInterval);
      }
    };
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.replace("/auth");
  };

  const isTokenValid = async (): Promise<boolean> => {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      const lastLoginTime = await AsyncStorage.getItem('lastLoginTime');
      
      if (!token || !lastLoginTime) return false;

      // Check if token has expired based on login time
      const loginTime = parseInt(lastLoginTime, 10);
      const currentTime = Date.now();
      const hoursSinceLogin = (currentTime - loginTime) / (1000 * 60 * 60);

      if (hoursSinceLogin >= TOKEN_EXPIRATION_HOURS) {
        await handleLogout();
        return false;
      }

      // Verify token structure
      try {
        const decoded = jwtDecode(token);
        if (!decoded) return false;
      } catch (e) {
        console.error('Token decode error:', e);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Token validation error:', error);
      await handleLogout();
      return false;
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/login`, {
        email,
        password
      });
  
      if (response.data.status === 'success' || (response.data.access_token && response.data.user)) {
        const token = response.data.access_token;
        const userData = response.data.user;
  
        setAccessToken(token);
        setUser(userData);
  
        // Store in AsyncStorage with current timestamp
        await AsyncStorage.setItem('accessToken', token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('lastLoginTime', Date.now().toString());
  
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('Sign in error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
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
      });
  
      if (response.data.status === 'success') {
        const token = response.data.access_token;
        const userData = response.data.user;
  
        setAccessToken(token);
        setUser(userData);
  
        // Store in AsyncStorage with current timestamp
        await AsyncStorage.setItem('accessToken', token);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('lastLoginTime', Date.now().toString());
  
        return true;
      }
      return false;
    } catch (error) {
      console.error('Sign up error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Clear all auth-related storage
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('lastLoginTime');

      setAccessToken(null);
      setUser(null);
    } catch (error) {
      console.error('Sign out error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const loadStoredUser = async () => {
      setIsLoading(true);
      try {
        const valid = await isTokenValid();
        if (!valid) {
          await handleLogout();
          return;
        }

        const token = await AsyncStorage.getItem('accessToken');
        const userData = await AsyncStorage.getItem('user');
  
        if (token && userData) {
          setAccessToken(token);
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error('Error loading stored user:', error);
        await handleLogout();
      } finally {
        setIsLoading(false);
      }
    };
  
    loadStoredUser();
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      signIn,
      signUp,
      signOut,
      isLoading,
      isTokenValid
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