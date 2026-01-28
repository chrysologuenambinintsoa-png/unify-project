'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';

export const PageLoader: React.FC = () => {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + Math.random() * 25;
        return Math.min(newProgress, 90);
      });
    }, 150);

    const timer = setTimeout(() => {
      setProgress(100);
      clearInterval(progressInterval);
    }, 500);

    const hideTimer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    return () => {
      clearInterval(progressInterval);
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className="fixed inset-0 z-40 bg-gradient-to-b from-amber-50 to-blue-50 backdrop-blur-sm flex flex-col items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Conteneur principal */}
          <div className="flex flex-col items-center gap-6 w-full max-w-sm px-6">
            {/* Logo petit */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-4xl"
            >
              ✨
            </motion.div>

            {/* Barre de progression cohérente */}
            <div className="w-full space-y-3">
              <div className="w-full h-2 bg-amber-200 rounded-full overflow-hidden shadow-sm">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary-dark via-accent-dark to-primary-dark"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>

              {/* Texte de progression */}
              <motion.p
                className="text-xs text-primary-dark font-medium text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                Chargement... {Math.round(progress)}%
              </motion.p>
            </div>

            {/* Points indicateurs */}
            <motion.div
              className="flex justify-center gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary-dark"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.15,
                  }}
                />
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
