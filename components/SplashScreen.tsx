'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRealProgress } from '@/hooks/useRealProgress';
import Image from 'next/image';

interface SplashScreenProps {
  isLoading: boolean;
  onComplete?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isLoading,
  onComplete,
}) => {
  const [showSplash, setShowSplash] = useState(true);
  const { progress, isComplete, connectionSpeed } = useRealProgress(isLoading);

  useEffect(() => {
    if (isComplete && !isLoading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        onComplete?.();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [isComplete, isLoading, onComplete]);

  if (!showSplash) return null;

  // Déterminer le message basé sur la vitesse de connexion
  const getSpeedMessage = () => {
    switch (connectionSpeed) {
      case 'fast':
        return 'Connexion rapide ⚡';
      case 'slow':
        return 'Connexion lente 🐢';
      case 'medium':
        return 'Chargement...';
      default:
        return 'Chargement...';
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-primary-dark via-amber-900 to-primary-dark"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Fond animé */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
          }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
          }}
          style={{ bottom: '10%', right: '10%' }}
        />
      </div>

      <div className="relative z-10 text-center px-6 w-full max-w-md">
        {/* Logo Unify */}
        <motion.div
          className="flex justify-center mb-8"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 100,
            damping: 15,
            delay: 0.2,
          }}
        >
          <motion.div
            className="relative"
            animate={{ y: [0, -10, 0] }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <div className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/30">
              <img src="/logo.svg" alt="Unify" className="w-12 h-12" />
            </div>
          </motion.div>
        </motion.div>

        {/* Texte principal */}
        <motion.h1
          className="text-4xl font-bold text-white mb-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          Unify
        </motion.h1>

        {/* Message de statut avec vitesse de connexion */}
        <motion.p
          className="text-white/80 text-base mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {getSpeedMessage()}
        </motion.p>

        {/* Barre de progression synchronisée */}
        <motion.div
          className="h-1 bg-white/20 rounded-full overflow-hidden"
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-white via-white/80 to-white/60 rounded-full shadow-lg"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </motion.div>

        {/* Pourcentage de progression */}
        <motion.p
          className="text-white/60 text-xs mt-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          {Math.round(progress)}%
        </motion.p>
      </div>
    </motion.div>
  );
};
