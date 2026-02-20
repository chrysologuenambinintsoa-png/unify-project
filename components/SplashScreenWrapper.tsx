'use client';

import React, { useEffect, useState } from 'react';
import { useSplashScreen } from '@/hooks/useSplashScreen';
import { SplashScreen } from './SplashScreen';

export const SplashScreenWrapper: React.FC = () => {
  const shouldShow = useSplashScreen();
  const [isVisible, setIsVisible] = useState(shouldShow);

  useEffect(() => {
    if (shouldShow) {
      setIsVisible(true);

      // Hide splash after 2.5 seconds minimum
      const minTimer = setTimeout(() => {
        setIsVisible(false);
      }, 2500);

      // Also detect when page content is fully loaded and interactive
      const handlePageReady = () => {
        // Check if main content has loaded
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          setIsVisible(false);
        }
      };

      // Listen for page ready state changes
      document.addEventListener('DOMContentLoaded', handlePageReady);
      document.addEventListener('load', handlePageReady);

      return () => {
        clearTimeout(minTimer);
        document.removeEventListener('DOMContentLoaded', handlePageReady);
        document.removeEventListener('load', handlePageReady);
      };
    }
  }, [shouldShow]);

  if (!isVisible) {
    return null;
  }

  return <SplashScreen isLoading={true} />;
};
