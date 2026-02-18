'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function VideosSkeleton() {
  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Filters/Tabs */}
        <motion.div
          className="flex gap-4 mb-6 overflow-x-auto pb-2"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-32 bg-gray-300 dark:bg-gray-700 rounded-full flex-shrink-0" />
          ))}
        </motion.div>

        {/* Videos Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
              {/* Video Thumbnail */}
              <div className="relative w-full h-32 bg-gray-300 dark:bg-gray-700 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-gray-400 dark:bg-gray-600" />
              </div>
              {/* Info */}
              <div className="p-3 space-y-2">
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
                    <div className="h-2 w-16 bg-gray-300 dark:bg-gray-700 rounded" />
                  </div>
                </div>
                <div className="h-2 w-full bg-gray-300 dark:bg-gray-700 rounded" />
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
