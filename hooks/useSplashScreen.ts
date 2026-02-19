"use client";

import { useEffect, useState } from 'react';

/**
 * Affiche le splash screen seulement au premier chargement de l'application
 * dans la session courante, mais évite de l'afficher si la navigation
 * précédente était une page de `login` ou `register`.
 */
export const useSplashScreen = () => {
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const alreadyShown = sessionStorage.getItem('unify:splash-shown');
      const lastRoute = (sessionStorage.getItem('unify:last-route') || '').toLowerCase();

      // If already shown this session, don't show again
      if (alreadyShown) return;

      // If the last route seems to be login/register, skip showing
      if (/login|register/.test(lastRoute)) {
        sessionStorage.setItem('unify:splash-shown', 'true');
        return;
      }

      // Show splash on initial cold-open of the app
      sessionStorage.setItem('unify:splash-shown', 'true');
      setShowSplash(true);
    } catch (e) {
      // If sessionStorage unavailable (incognito / security), fallback to one-time per mount
      setShowSplash(true);
    }
  }, []);

  return showSplash;
};

