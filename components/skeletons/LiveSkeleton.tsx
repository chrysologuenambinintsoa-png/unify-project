'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function LiveSkeleton() {
  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Title */}
        <motion.div
          className="h-8 w-40 bg-gray-300 dark:bg-gray-700 rounded mb-6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Tabs/Filters */}
        <motion.div
          className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-6 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
          ))}
        </motion.div>

        {/* Live Sessions Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
              {/* Live Badge + Thumbnail */}
              <div className="relative w-full h-48 bg-gray-300 dark:bg-gray-700">
                <div className="absolute top-3 right-3 px-2 py-1 bg-red-500 rounded text-white text-xs font-bold">
                  LIVE
                </div>
              </div>
              {/* Info */}
              <div className="p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-gray-300 dark:bg-gray-700 rounded" />
                <div className="h-8 w-full bg-gray-300 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
