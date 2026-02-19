'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

/**
 * Hook pour afficher le splash screen au premier chargement authentifié
 */
export const useSplashScreen = () => {
  const { data: session, status } = useSession();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Skip on server side
    if (typeof window === 'undefined') {
      return;
    }

    // Only show splash on initial load when authenticated
    if (status === 'authenticated' && session?.user?.id) {
      const alreadyShown = sessionStorage.getItem('unify:splash-shown');
      
      if (!alreadyShown) {
        sessionStorage.setItem('unify:splash-shown', 'true');
        setShowSplash(true);
      }
    }
  }, [status, session]);

  return showSplash;
};

