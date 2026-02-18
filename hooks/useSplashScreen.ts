'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Safe wrapper for sessionStorage that handles errors
 */
function getSafeSessionStorage(key: string): string | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return null;
    }
    return window.sessionStorage.getItem(key);
  } catch (error) {
    console.warn('[useSplashScreen] Session storage not available:', error);
    return null;
  }
}

function setSafeSessionStorage(key: string, value: string): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) {
      return;
    }
    window.sessionStorage.setItem(key, value);
  } catch (error) {
    console.warn('[useSplashScreen] Could not set session storage:', error);
  }
}

export const useSplashScreen = () => {
  const { data: session, status } = useSession();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Skip on server side
    if (typeof window === 'undefined') {
      console.log('[useSplashScreen] Running on server, skipping');
      return;
    }

    console.log('[useSplashScreen] Checking splash screen trigger', { status, hasSession: !!session?.user?.id });

    // 1. Check if this is the first browser session startup
    const sessionTag = getSafeSessionStorage('unify:sessionInitialized');
    
    if (!sessionTag) {
      setSafeSessionStorage('unify:sessionInitialized', 'true');
      
      // Show splash only if authenticated
      if (session?.user?.id) {
        console.log('[useSplashScreen] First session - showing splash');
        setShowSplash(true);
        const timer = setTimeout(() => {
          console.log('[useSplashScreen] Hiding splash after 2s');
          setShowSplash(false);
        }, 2000);
        return () => clearTimeout(timer);
      } else {
        console.log('[useSplashScreen] Not authenticated - skipping splash');
        setShowSplash(false);
      }
    } else {
      console.log('[useSplashScreen] Session already initialized');
    }

    // 2. Check for user session change
    const storedUserId = localStorage.getItem('unify:lastUserId');
    const currentUserId = session?.user?.id || null;

    if (currentUserId && storedUserId && storedUserId !== currentUserId) {
      // User changed - show splash
      console.log('[useSplashScreen] User changed - showing splash');
      setShowSplash(true);
      localStorage.setItem('unify:lastUserId', currentUserId);
      
      const timer = setTimeout(() => {
        console.log('[useSplashScreen] Hiding splash after user change');
        setShowSplash(false);
      }, 2000);
      return () => clearTimeout(timer);
    }

    // First login - store user ID
    if (currentUserId && !storedUserId) {
      console.log('[useSplashScreen] First login - storing user ID');
      localStorage.setItem('unify:lastUserId', currentUserId);
    }

    // Logout - clear user ID
    if (!session && storedUserId) {
      console.log('[useSplashScreen] Logout - clearing user ID');
      localStorage.removeItem('unify:lastUserId');
    }
  }, [session?.user?.id, session, status]);

  return showSplash;
};

