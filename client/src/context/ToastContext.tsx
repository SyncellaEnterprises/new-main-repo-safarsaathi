import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

// Types
type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  show: (message: string, type?: ToastType) => void;
}

interface ToastColors {
  gradient: readonly [string, string];
  icon: keyof typeof Feather.glyphMap;
}

// Constants
const TOAST_CONFIG: Record<ToastType, ToastColors> = {
  success: {
    gradient: ['#7C3AED', '#06B6D4'] as const,
    icon: 'check-circle'
  },
  error: {
    gradient: ['#7C3AED', '#FF8FB1'] as const,
    icon: 'alert-circle'
  },
  info: {
    gradient: ['#7C3AED', '#06B6D4'] as const,
    icon: 'info'
  }
};

const ANIMATION_DURATION = {
  show: 300,
  hide: 200,
  display: 3000
};

// Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  // State
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<ToastType>('info');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const hideTimeout = useRef<NodeJS.Timeout>();

  // Animation sequences
  const showAnimation = useCallback(() => {
    return Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: ANIMATION_DURATION.show,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        damping: 15,
        stiffness: 200,
        useNativeDriver: true,
      }),
    ]);
  }, [fadeAnim, translateY]);

  const hideAnimation = useCallback(() => {
    return Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: ANIMATION_DURATION.hide,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 20,
        damping: 15,
        stiffness: 200,
        useNativeDriver: true,
      }),
    ]);
  }, [fadeAnim, translateY]);

  // Show toast function
  const show = useCallback((msg: string, toastType: ToastType = 'info') => {
    // Clear any existing timeout
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
    }

    // Reset and set new values
    setMessage(msg);
    setType(toastType);
    setVisible(true);
    fadeAnim.setValue(0);
    translateY.setValue(20);

    // Start show animation
    showAnimation().start();

    // Set hide timeout
    hideTimeout.current = setTimeout(() => {
      hideAnimation().start(() => setVisible(false));
    }, ANIMATION_DURATION.display);
  }, [fadeAnim, translateY, showAnimation, hideAnimation]);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {visible && (
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY }],
            }
          ]}
        >
          <BlurView intensity={30} tint="dark" style={styles.blurContainer}>
            <LinearGradient
              colors={TOAST_CONFIG[type].gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradient}
            >
              <View style={styles.content}>
                <Feather name={TOAST_CONFIG[type].icon} size={20} color="#fff" />
                <Text style={styles.message}>{message}</Text>
              </View>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

// Hook
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Styles
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    alignItems: 'center',
    zIndex: 9999,
  },
  blurContainer: {
    overflow: 'hidden',
    borderRadius: 16,
    width: width - 40,
  },
  gradient: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginLeft: 8,
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Montserrat',
  },
});
