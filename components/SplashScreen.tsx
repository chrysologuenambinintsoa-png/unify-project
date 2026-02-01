'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  const progressRef = useRef(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isLoading) {
      timerRef.current = setTimeout(() => {
        setShowSplash(false);
        onComplete?.();
      }, 2500);

      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [isLoading, onComplete]);

  // Animation de la barre de progression optimisée
  useEffect(() => {
    if (!showSplash) return;

    progressRef.current = 0;
    setProgress(0);

    // Phase 1: Progression rapide jusqu'à 60%
    intervalRef.current = setInterval(() => {
      progressRef.current += Math.random() * 15;
      if (progressRef.current >= 60) {
        progressRef.current = 60;
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
      setProgress(Math.min(progressRef.current, 100));
    }, 250);

    // Phase 2: Progression lente jusqu'à 95%
    const slowTimer = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      intervalRef.current = setInterval(() => {
        progressRef.current += Math.random() * 8;
        if (progressRef.current >= 95) {
          progressRef.current = 95;
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
        setProgress(Math.min(progressRef.current, 100));
      }, 300);
    }, 1500);

    // Phase 3: Complétion finale
    const finalTimer = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      progressRef.current = 100;
      setProgress(100);
    }, 2200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(slowTimer);
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
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          {/* Conteneur de la barre */}
          <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden shadow-lg backdrop-blur-sm">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-300 via-yellow-200 to-amber-200 rounded-full shadow-md"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            />
          </div>

          {/* Texte du pourcentage */}
          <motion.p
            className="text-white/80 text-xs font-medium tracking-wider"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
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
