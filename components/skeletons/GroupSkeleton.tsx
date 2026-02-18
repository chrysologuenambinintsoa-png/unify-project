'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function GroupSkeleton() {
  return (
    <div className="py-6">
      {/* Header Section */}
      <motion.div
        className="bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600 p-8 flex items-end gap-4"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {/* Avatar Skeleton */}
        <div className="w-32 h-32 rounded-2xl bg-gray-400 dark:bg-gray-600 flex-shrink-0" />

        {/* Title and Info Skeleton */}
        <div className="flex-1 space-y-3">
          <div className="h-8 w-48 bg-gray-400 dark:bg-gray-600 rounded" />
          <div className="h-4 w-64 bg-gray-400 dark:bg-gray-600 rounded" />
          <div className="flex gap-4">
            <div className="h-4 w-24 bg-gray-400 dark:bg-gray-600 rounded" />
            <div className="h-4 w-24 bg-gray-400 dark:bg-gray-600 rounded" />
          </div>
        </div>

        {/* Button Skeleton */}
        <div className="h-10 w-32 bg-gray-400 dark:bg-gray-600 rounded-lg flex-shrink-0" />
      </motion.div>

      <div className="max-w-6xl mx-auto px-4 mt-8">
        {/* Tabs Skeleton */}
        <motion.div
          className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-6 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
          ))}
        </motion.div>

        {/* Content Skeleton */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        >
          <div className="lg:col-span-2 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-6 space-y-3">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
                  </div>
                </div>
                <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded" />
                <div className="h-4 w-5/6 bg-gray-300 dark:bg-gray-700 rounded" />
                <div className="h-32 w-full bg-gray-300 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>

          {/* Members Skeleton */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 h-fit space-y-3">
            <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
