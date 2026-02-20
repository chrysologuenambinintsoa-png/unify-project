'use client';

import React, { useEffect, useState } from 'react';
import { useSplashScreen } from '@/hooks/useSplashScreen';
import { SplashScreen } from './SplashScreen';

export const SplashScreenWrapper: React.FC = () => {
  const shouldShow = useSplashScreen();
  // Show splash immediately if needed, without waiting for client mount
  // This ensures splash displays before page content
  const [isVisible, setIsVisible] = useState(shouldShow);

  useEffect(() => {
    if (shouldShow) {
      setIsVisible(true);
      // Auto-hide after 2.5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [shouldShow]);

  // Return null only if we're definitely NOT showing the splash
  // This prevents content from rendering before the splash
  if (!isVisible) {
    return null;
  }

  return <SplashScreen isLoading={true} />;
};
