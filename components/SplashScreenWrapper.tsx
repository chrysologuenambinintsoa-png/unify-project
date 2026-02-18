'use client';

import React, { useEffect, useState } from 'react';
import { useSplashScreen } from '@/hooks/useSplashScreen';
import { SplashScreen } from './SplashScreen';

export const SplashScreenWrapper: React.FC = () => {
  const showSplashTrigger = useSplashScreen();
  const [isLoading, setIsLoading] = useState(showSplashTrigger);

  useEffect(() => {
    if (showSplashTrigger) {
      setIsLoading(true);
      // Afficher le splash pendant 2 secondes
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showSplashTrigger]);

  if (!showSplashTrigger && !isLoading) return null;

  return (
    <SplashScreen
      isLoading={isLoading}
      onComplete={() => {
        // Splash screen se masquera automatiquement
      }}
    />
  );
};
