'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-4"
        >
          <img src="/logo.svg" alt="Unify" className="w-16 h-16 mx-auto" />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-2xl font-bold text-primary-dark mb-2"
        >
          Unify
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-gray-600"
        >
          Chargement...
        </motion.p>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ delay: 0.6, duration: 1 }}
          className="mt-4 h-1 bg-primary-dark rounded-full mx-auto max-w-xs"
        />
      </div>
    </div>
  );
}