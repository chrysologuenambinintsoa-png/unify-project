'use client';

import React, { useEffect, useState } from 'react';
import { useSplashScreen } from '@/hooks/useSplashScreen';
import { SplashScreen } from './SplashScreen';

export const SplashScreenWrapper: React.FC = () => {
  const shouldShow = useSplashScreen();
  const [isVisible, setIsVisible] = useState(false);
  const [hasClientMounted, setHasClientMounted] = useState(false);

  useEffect(() => {
    setHasClientMounted(true);
  }, []);

  useEffect(() => {
    if (shouldShow && hasClientMounted) {
      setIsVisible(true);
      // Auto-hide after 2.5 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [shouldShow, hasClientMounted]);

  if (!hasClientMounted || !isVisible) {
    return null;
  }

  return <SplashScreen isLoading={isVisible} />;
};
