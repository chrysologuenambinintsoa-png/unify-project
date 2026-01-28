'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
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
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        onComplete?.();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isLoading, onComplete]);

  // Animation de la barre de progression
  useEffect(() => {
    if (!showSplash) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 30;
        return Math.min(newProgress, 90);
      });
    }, 300);

    const finalTimer = setTimeout(() => {
      setProgress(100);
    }, 2500);

    return () => {
      clearInterval(interval);
      clearTimeout(finalTimer);
    };
  }, [showSplash]);

  if (!showSplash) return null;

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-950 via-amber-900 to-blue-900 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Fond animé avec dégradé */}
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
        {/* Logo Unify avec animation */}
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
            <Image
              src="/logo.svg"
              alt="Unify Logo"
              width={100}
              height={100}
              priority
              className="drop-shadow-lg"
            />
          </motion.div>
        </motion.div>

        {/* Titre principal */}
        <motion.h1
          className="text-6xl font-bold text-white mb-4 drop-shadow-lg"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.4,
            ease: 'easeOut',
          }}
        >
          Unify
        </motion.h1>

        {/* Texte de bienvenue */}
        <motion.p
          className="text-2xl text-white/90 mb-8 drop-shadow-md"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.6,
            ease: 'easeOut',
          }}
        >
          Bienvenue
        </motion.p>

        {/* Sous-texte */}
        <motion.p
          className="text-lg text-white/80 mb-12 drop-shadow-md"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            duration: 0.8,
            delay: 0.8,
            ease: 'easeOut',
          }}
        >
          Connectez-vous au monde
        </motion.p>

        {/* Barre de progression améliorée */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        >
          {/* Conteneur de la barre */}
          <div className="w-full h-2 bg-yellow-200/50 rounded-full overflow-hidden shadow-lg">
            <motion.div
              className="h-full bg-gradient-to-r from-white via-yellow-300 to-white rounded-full shadow-md"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>

          {/* Texte du pourcentage */}
          <motion.p
            className="text-white/70 text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            {Math.round(progress)}%
          </motion.p>
        </motion.div>

        {/* Points indicateurs */}
        <motion.div
          className="flex justify-center gap-3 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-white/60"
              animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};
