'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function HomeSkeleton() {
  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-6">
          {/* Left Sidebar - Stories and Post Creator */}
          <div className="lg:col-span-1 space-y-4">
            {/* Stories Skeleton */}
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-lg p-4 flex gap-2 overflow-x-auto"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-24 h-32 bg-gray-300 dark:bg-gray-700 rounded flex-shrink-0"
                />
              ))}
            </motion.div>

            {/* Post Creator Skeleton */}
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-lg p-6 space-y-4"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
            >
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                <div className="flex-1 h-10 bg-gray-300 dark:bg-gray-700 rounded-full" />
              </div>
              <div className="flex gap-2 pt-2">
                <div className="flex-1 h-8 bg-gray-300 dark:bg-gray-700 rounded" />
                <div className="flex-1 h-8 bg-gray-300 dark:bg-gray-700 rounded" />
              </div>
            </motion.div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-1 space-y-4">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-4"
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 + i * 0.05 }}
              >
                {/* Post Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
                  </div>
                </div>

                {/* Post Content */}
                <div className="space-y-2">
                  <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-5/6 bg-gray-300 dark:bg-gray-700 rounded" />
                </div>

                {/* Post Image */}
                <div className="w-full h-48 bg-gray-300 dark:bg-gray-700 rounded" />

                {/* Post Interactions */}
                <div className="flex gap-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                  {[0, 1, 2].map((j) => (
                    <div key={j} className="h-8 w-12 bg-gray-300 dark:bg-gray-700 rounded" />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Right Sidebar - Suggestions */}
          <div className="lg:col-span-1 space-y-4">
            {/* Friends Suggestions */}
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-3"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            >
              <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-2 p-2">
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
                    <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
                    <div className="h-2 w-16 bg-gray-300 dark:bg-gray-700 rounded" />
                  </div>
                </div>
              ))}
            </motion.div>

            {/* Pages Suggestions */}
            <motion.div
              className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-3"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
            >
              <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
              {[0, 1].map((i) => (
                <div key={i} className="p-2 border border-gray-200 dark:border-gray-700 rounded">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                    <div className="flex-1 h-3 bg-gray-300 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
