/**
 * Mobile Optimization Utilities
 * Helps with responsive design and mobile-specific fixes
 */

import React from 'react';

/**
 * Detect if device is mobile
 */
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

/**
 * Get viewport dimensions
 */
export const getViewportDimensions = () => {
  if (typeof window === 'undefined') {
    return { width: 0, height: 0 };
  }
  return {
    width: window.innerWidth,
    height: window.innerHeight,
  };
};

/**
 * Check if viewport is mobile size
 */
export const isMobileViewport = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
};

/**
 * Disable pinch zoom on mobile
 */
export const disablePinchZoom = () => {
  if (typeof document === 'undefined') return;

  document.addEventListener(
    'touchmove',
    (e) => {
      if ((e as any).touches.length > 1) {
        e.preventDefault();
      }
    },
    { passive: false }
  );
};

/**
 * Prevent viewport zoom on iOS
 */
export const preventIOSZoom = () => {
  if (typeof document === 'undefined') return;

  document.addEventListener(
    'touchmove',
    function (e) {
      if ((e as any).touches.length > 1) {
        e.preventDefault();
      }
    },
    false
  );

  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    function (e) {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    },
    false
  );
};

/**
 * Safe area class names for notched devices
 */
export const getSafeAreaClasses = (): string => {
  return 'pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]';
};

/**
 * Format touch events for mobile
 */
export const handleTouchStart = (
  e: React.TouchEvent,
  callback?: () => void
) => {
  if (callback) {
    callback();
  }
};

export const handleTouchEnd = (
  e: React.TouchEvent,
  callback?: () => void
) => {
  if (callback) {
    callback();
  }
};

/**
 * Viewport meta tag settings for PWA
 */
export const getViewportSettings = (): string => {
  return 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes, viewport-fit=cover';
};

/**
 * Mobile scrolling optimization
 */
export const enableMobileScrolling = () => {
  if (typeof document === 'undefined') return;

  (document.body.style as any).webkitOverflowScrolling = 'touch';
  (document.documentElement.style as any).webkitOverflowScrolling = 'touch';
};

/**
 * Custom hook for mobile responsiveness
 */
export const useResponsive = () => {
  const [isMobile, setIsMobile] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(isMobileViewport());
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return {
    isMobile: isMobile ?? false,
    isDesktop: isMobile === false,
  };
};
