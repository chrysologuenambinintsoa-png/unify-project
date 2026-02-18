'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

export const useSplashScreen = () => {
  const { data: session, status } = useSession();
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    // Skip on server side
    if (typeof window === 'undefined') return;

    // 1. Vérifier si c'est le premier démarrage de la session navigateur (depuis l'ouverture du navigateur)
    const sessionTag = sessionStorage.getItem('unify:sessionInitialized');
    if (!sessionTag) {
      // Premier démarrage du navigateur - afficher le splash
      sessionStorage.setItem('unify:sessionInitialized', 'true');
      
      // Vérifier aussi si on a une session utilisateur authentifiée
      if (session?.user?.id) {
        setShowSplash(true);
        const timer = setTimeout(() => setShowSplash(false), 2000);
        return () => clearTimeout(timer);
      }
    }

    // 2. Vérifier si c'est un changement de session utilisateur (login d'un autre utilisateur)
    const storedUserId = localStorage.getItem('unify:lastUserId');
    const currentUserId = session?.user?.id || null;

    if (currentUserId && storedUserId && storedUserId !== currentUserId) {
      // Changement d'utilisateur - afficher le splash
      setShowSplash(true);
      localStorage.setItem('unify:lastUserId', currentUserId);
      
      const timer = setTimeout(() => setShowSplash(false), 2000);
      return () => clearTimeout(timer);
    }

    // Première connexion - enregistrer l'ID
    if (currentUserId && !storedUserId) {
      localStorage.setItem('unify:lastUserId', currentUserId);
    }

    // Déconnexion - nettoyer l'ID utilisateur
    if (!session && storedUserId) {
      localStorage.removeItem('unify:lastUserId');
    }
  }, [session?.user?.id, session]);

  return showSplash;
};

