'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

/**
 * Barre de progression globale synchronisée avec la navigation des pages
 * S'affiche lors du changement de route et se complète automatiquement
 */
export const PageProgressBar: React.FC = () => {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let isStillMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    let intervalId: NodeJS.Timeout | null = null;

    // Démarrer la barre immédiatement au changement de route
    setIsVisible(true);
    setProgress(10);

    // Progression progressive naturelle (plus lente au début, puis accélère)
    intervalId = setInterval(() => {
      if (!isStillMounted) return;
      setProgress((prev) => {
        if (prev < 90) {
          // Progression plus rapide au début, puis ralentit
          const increment = prev < 50 
            ? Math.random() * 15 + 5  // 5-20% quand < 50%
            : Math.random() * 8 + 2;   // 2-10% quand > 50%
          return Math.min(prev + increment, 90);
        }
        return prev;
      });
    }, 300);

    // Compléter la barre après 1-2 secondes (simule le chargement)
    timeoutId = setTimeout(() => {
      if (!isStillMounted) return;
      setProgress(100);
      
      // Disparaître après 600ms
      const hideId = setTimeout(() => {
        if (isStillMounted) {
          setIsVisible(false);
          setProgress(0);
        }
      }, 600);
      
      return () => clearTimeout(hideId);
    }, 800 + Math.random() * 400); // 800-1200ms

    return () => {
      isStillMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [pathname]);

  if (!isVisible || progress === 0) return null;

  return (
    <>
      {/* Barre de progression principale */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        exit={{ opacity: 0, scaleX: 0 }}
        className="fixed top-0 left-0 h-1.5 bg-primary-dark z-[9999] origin-left shadow-lg"
        style={{
          width: `${Math.min(progress, 100)}%`,
        }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      />
      
      {/* Ombre subtile sous la barre */}
      {progress > 20 && (
        <motion.div
          className="fixed top-1.5 left-0 h-px bg-gradient-to-r from-primary-dark/30 to-transparent z-[9998]"
          style={{
            width: `${Math.min(progress, 100)}%`,
          }}
          transition={{ duration: 0.25 }}
        />
      )}
    </>
  );
};

export default PageProgressBar;
