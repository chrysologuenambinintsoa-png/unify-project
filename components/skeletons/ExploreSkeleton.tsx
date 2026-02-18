'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function ExploreSkeleton() {
  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Search Bar */}
        <motion.div
          className="mb-6 h-12 bg-gray-300 dark:bg-gray-700 rounded-full"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        {/* Tabs */}
        <motion.div
          className="flex gap-4 mb-6 border-b border-gray-200 dark:border-gray-700"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-6 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
          ))}
        </motion.div>

        {/* Content Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        >
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
              {/* Image */}
              <div className="w-full h-48 bg-gray-300 dark:bg-gray-700" />
              {/* Content */}
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
                    <div className="h-2 w-16 bg-gray-300 dark:bg-gray-700 rounded" />
                  </div>
                </div>
                <div className="h-3 w-full bg-gray-300 dark:bg-gray-700 rounded" />
                <div className="flex gap-4">
                  <div className="h-4 w-12 bg-gray-300 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-12 bg-gray-300 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
