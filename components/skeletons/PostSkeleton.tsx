'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function PostSkeleton() {
  return (
    <motion.div
      className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-3"
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {/* Author Info */}
      <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-3 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="h-4 w-5/6 bg-gray-300 dark:bg-gray-700 rounded" />
      </div>

      {/* Image/Media Placeholder */}
      <div className="w-full h-48 bg-gray-300 dark:bg-gray-700 rounded" />

      {/* Interactions */}
      <div className="flex gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="h-8 w-12 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="h-8 w-12 bg-gray-300 dark:bg-gray-700 rounded" />
        <div className="h-8 w-12 bg-gray-300 dark:bg-gray-700 rounded" />
      </div>
    </motion.div>
  );
}
