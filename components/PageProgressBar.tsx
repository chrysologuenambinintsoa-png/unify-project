'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';

/**
 * Barre de progression globale pour les transitions de pages
 * S'affiche automatiquement lors de la navigation
 */
export const PageProgressBar: React.FC = () => {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Commencer la barre de progression
    setIsVisible(true);
    setProgress(10);

    // Progression lente
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < 90) {
          return prev + Math.random() * 30;
        }
        return prev;
      });
    }, 200);

    // Terminer la barre après un délai
    const timer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 300);
    }, 800);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [pathname]);

  if (!isVisible || progress === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed top-0 left-0 h-1 bg-gradient-to-r from-primary to-accent z-[9999]"
      style={{
        width: `${Math.min(progress, 100)}%`,
      }}
      transition={{ duration: 0.3 }}
    />
  );
};

export default PageProgressBar;
