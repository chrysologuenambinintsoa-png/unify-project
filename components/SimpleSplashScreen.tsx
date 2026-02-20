'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SimpleSplashScreenProps {
  duration?: number;
  onComplete?: () => void;
  variant?: 'modern' | 'minimal' | 'colorful';
}

export const SimpleSplashScreen: React.FC<SimpleSplashScreenProps> = ({
  duration = 3000,
  onComplete,
  variant = 'modern',
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onComplete]);

  const variants = useMemo(
    () => ({
      modern: {
        bg: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
        accentColors: 'from-blue-500 via-purple-500 to-pink-500',
      },
      minimal: {
        bg: 'bg-white',
        accentColors: 'from-gray-400 to-gray-600',
      },
      colorful: {
        bg: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600',
        accentColors: 'from-yellow-300 via-pink-300 to-white',
      },
    }),
    []
  );

  const currentVariant = variants[variant];

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          className={`fixed inset-0 z-50 flex items-center justify-center ${currentVariant.bg}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Fond animé optimisé */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <motion.div
              className="absolute w-80 h-80 rounded-full opacity-20 blur-3xl bg-blue-500"
              animate={{
                x: [0, 100, 0],
                y: [0, 50, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ top: '10%', left: '5%' }}
            />
            <motion.div
              className="absolute w-80 h-80 rounded-full opacity-20 blur-3xl bg-purple-500"
              animate={{
                x: [0, -100, 0],
                y: [0, -50, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              style={{ bottom: '10%', right: '5%' }}
            />
          </div>

          {/* Contenu */}
          <motion.div
            className="relative z-10 text-center"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 80, damping: 18 }}
          >
            {/* Cercle animé - Logo sans bordure blanche et taille responsive universelle */}
            <motion.div className="mb-6 sm:mb-8 md:mb-10 lg:mb-12 flex justify-center px-4">
              <motion.div
                className={`w-32 sm:w-40 md:w-48 lg:w-56 aspect-square rounded-full bg-gradient-to-br ${currentVariant.accentColors} p-0 shadow-2xl flex items-center justify-center overflow-hidden border-0`}
                animate={{ rotate: 360 }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              >
                <div
                  className="w-28 sm:w-36 md:w-44 lg:w-52 aspect-square rounded-full bg-transparent flex items-center justify-center text-[4rem] sm:text-[5rem] md:text-[6rem] m-0 p-0"
                >
                  {/* Use an SVG or image if available — emoji kept as fallback */}
                  📱
                </div>
              </motion.div>
            </motion.div>

            {/* Texte */}
            <motion.h1
              className={`text-3xl sm:text-4xl md:text-5xl font-bold mb-2 sm:mb-3 md:mb-4 px-4 ${variant === 'minimal' ? 'text-black' : 'text-white'}`}
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              Unify
            </motion.h1>

            {/* Sous-titre avec animation */}
            <motion.p
              className={`text-base sm:text-lg md:text-xl mb-6 sm:mb-8 px-4 ${variant === 'minimal' ? 'text-gray-600' : 'text-white'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
              Bienvenue
            </motion.p>

            {/* Indicateur de chargement optimisé */}
            <motion.div className="flex justify-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className={`w-3 h-3 rounded-full ${
                    variant === 'minimal' ? 'bg-gray-400' : 'bg-white'
                  }`}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: i * 0.2,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
