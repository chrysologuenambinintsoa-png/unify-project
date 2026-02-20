'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface SplashScreenProps {
  isLoading: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isLoading }) => {
  const [showSplash, setShowSplash] = useState(isLoading);

  useEffect(() => {
    if (!isLoading) {
      // Delay hiding to let exit animation play
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!showSplash) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-1.5 h-96 bg-gradient-to-b from-blue-500/20 via-blue-500/10 to-transparent rounded-full blur-md"
          animate={{
            x: [-200, 0, -200],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ top: '20%', left: '15%' }}
        />
        <motion.div
          className="absolute w-1.5 h-96 bg-gradient-to-b from-purple-500/20 via-purple-500/10 to-transparent rounded-full blur-md"
          animate={{
            x: [200, 0, 200],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ top: '20%', right: '15%' }}
        />
        <motion.div
          className="absolute w-32 h-32 rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
      </div>

      <div className="relative z-10 text-center px-6 w-full max-w-lg">
        {/* Logo */}
        <motion.div
          className="flex justify-center mb-10"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            type: 'spring',
            stiffness: 120,
            damping: 20,
            delay: 0.1,
          }}
        >
          <motion.div
            className="flex items-center justify-center"
            animate={{ y: [0, -8, 0] }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          >
            <Image
              src="/logo.svg"
              alt="Unify"
              width={80}
              height={80}
              priority
              className="drop-shadow-lg"
            />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-5xl font-bold text-white tracking-tight">
            Unify
          </h1>
          <p className="text-white/50 text-sm font-light mt-3 tracking-wider">
            Connectez votre communauté
          </p>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          className="mt-12 flex items-center justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-1 bg-blue-500 rounded-full"
            animate={{ width: ['6px', '24px', '6px'] }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
