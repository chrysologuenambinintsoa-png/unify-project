'use client';

import React, { useEffect, useState } from 'react';
import { useSplashScreen } from '@/hooks/useSplashScreen';
import { SplashScreen } from './SplashScreen';

export const SplashScreenWrapper: React.FC = () => {
  const shouldShow = useSplashScreen();
  const [isVisible, setIsVisible] = useState(shouldShow);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (shouldShow) {
      setIsVisible(true);

      // Block page content and scrolling while splash is visible
      const htmlElement = document.documentElement;
      const bodyElement = document.body;
      
      htmlElement.style.overflow = 'hidden';
      bodyElement.style.overflow = 'hidden';
      bodyElement.style.position = 'fixed';
      bodyElement.style.width = '100%';
      bodyElement.style.height = '100%';

      // Hide splash after 2.5 seconds minimum
      const minTimer = setTimeout(() => {
        setIsVisible(false);
        // Restore page scrolling
        htmlElement.style.overflow = '';
        bodyElement.style.overflow = '';
        bodyElement.style.position = '';
        bodyElement.style.width = '';
        bodyElement.style.height = '';
      }, 2500);

      return () => {
        clearTimeout(minTimer);
        // Cleanup - restore styles
        htmlElement.style.overflow = '';
        bodyElement.style.overflow = '';
        bodyElement.style.position = '';
        bodyElement.style.width = '';
        bodyElement.style.height = '';
      };
    }
  }, [shouldShow]);

  if (!isVisible) {
    return null;
  }

  return <SplashScreen isLoading={true} />;
};
