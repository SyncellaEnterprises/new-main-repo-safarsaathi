import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useSwipeLimit(dailyLimit: number) {
  const [swipesLeft, setSwipesLeft] = useState(dailyLimit);
  const [lastResetTime, setLastResetTime] = useState<Date | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState('');

  useEffect(() => {
    loadSwipeData();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  const loadSwipeData = async () => {
    try {
      const storedSwipes = await AsyncStorage.getItem('swipesLeft');
      const storedResetTime = await AsyncStorage.getItem('lastResetTime');
      
      if (storedResetTime) {
        const lastReset = new Date(storedResetTime);
        const now = new Date();
        const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceReset >= 24) {
          resetSwipes();
        } else {
          setLastResetTime(lastReset);
          setSwipesLeft(Number(storedSwipes) || dailyLimit);
        }
      } else {
        resetSwipes();
      }
    } catch (error) {
      console.error('Error loading swipe data:', error);
    }
  };

  const updateTimer = () => {
    if (lastResetTime) {
      const now = new Date();
      const nextReset = new Date(lastResetTime.getTime() + 24 * 60 * 60 * 1000);
      const diff = nextReset.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeUntilReset(`${hours}h ${minutes}m`);
    }
  };

  const resetSwipes = async () => {
    const now = new Date();
    setSwipesLeft(dailyLimit);
    setLastResetTime(now);
    await AsyncStorage.setItem('swipesLeft', String(dailyLimit));
    await AsyncStorage.setItem('lastResetTime', now.toISOString());
  };

  const decrementSwipes = async () => {
    const newCount = swipesLeft - 1;
    setSwipesLeft(newCount);
    await AsyncStorage.setItem('swipesLeft', String(newCount));
  };

  return {
    swipesLeft,
    timeUntilReset,
    isLimited: swipesLeft <= 0,
    decrementSwipes,
  };
} 