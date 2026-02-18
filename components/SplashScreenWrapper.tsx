'use client';

import React, { useEffect, useState } from 'react';
import { useSplashScreen } from '@/hooks/useSplashScreen';
import { SplashScreen } from './SplashScreen';

export const SplashScreenWrapper: React.FC = () => {
  const showSplashTrigger = useSplashScreen();
  const [isLoading, setIsLoading] = useState(showSplashTrigger);
  const [hasClientMounted, setHasClientMounted] = useState(false);

  // Ensure component mounts on client
  useEffect(() => {
    setHasClientMounted(true);
  }, []);

  useEffect(() => {
    if (showSplashTrigger) {
      console.log('[SplashScreenWrapper] Showing splash');
      setIsLoading(true);
      // Afficher le splash pendant 2 secondes
      const timer = setTimeout(() => {
        console.log('[SplashScreenWrapper] Hiding splash');
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    } else {
      console.log('[SplashScreenWrapper] Not showing splash');
      setIsLoading(false);
    }
  }, [showSplashTrigger]);

  // Don't render anything until client mounted
  if (!hasClientMounted) {
    return null;
  }

  // Only return the splash if we should show it
  if (!showSplashTrigger && !isLoading) {
    console.log('[SplashScreenWrapper] Not rendering - splash not needed');
    return null;
  }

  return (
    <SplashScreen
      isLoading={isLoading}
      onComplete={() => {
        console.log('[SplashScreenWrapper] Splash completed');
        // Splash screen will hide automatically
      }}
    />
  );
};
