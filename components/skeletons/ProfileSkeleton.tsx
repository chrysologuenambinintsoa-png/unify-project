'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function ProfileSkeleton() {
  return (
    <div className="py-6">
      {/* Cover Image Skeleton */}
      <motion.div
        className="w-full h-48 bg-gradient-to-r from-gray-300 to-gray-200 dark:from-gray-700 dark:to-gray-600"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />

      <div className="max-w-6xl mx-auto px-4">
        {/* Profile Header Section */}
        <motion.div
          className="relative -mt-20 mb-6 flex items-end gap-4 pb-6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        >
          {/* Avatar Skeleton */}
          <div className="w-40 h-40 rounded-xl bg-gray-300 dark:bg-gray-700 border-4 border-white dark:border-gray-800 flex-shrink-0" />

          {/* Profile Info Skeleton */}
          <div className="flex-1 pb-2 space-y-4">
            <div>
              <div className="h-8 w-56 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 w-48 bg-gray-300 dark:bg-gray-700 rounded" />
            </div>
            <div className="flex gap-6">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-1">
                  <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-12 bg-gray-300 dark:bg-gray-700 rounded" />
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons Skeleton */}
          <div className="flex gap-2 flex-shrink-0 pb-2">
            <div className="h-10 w-24 bg-gray-300 dark:bg-gray-700 rounded-lg" />
            <div className="h-10 w-24 bg-gray-300 dark:bg-gray-700 rounded-lg" />
          </div>
        </motion.div>

        {/* Bio/About Skeleton */}
        <motion.div
          className="bg-white dark:bg-gray-900 rounded-lg p-6 mb-6 space-y-3"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        >
          <div className="h-4 w-full bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-4 w-5/6 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-4 w-4/6 bg-gray-300 dark:bg-gray-700 rounded" />
        </motion.div>

        {/* Tabs Skeleton */}
        <motion.div
          className="flex gap-4 border-b border-gray-200 dark:border-gray-700 mb-6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
        >
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-6 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
          ))}
        </motion.div>

        {/* Content Area */}
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
        >
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-6 space-y-3">
                {/* Post Author */}
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                  <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                  <div className="flex-1 space-y-1">
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
                <div className="h-48 w-full bg-gray-300 dark:bg-gray-700 rounded" />
              </div>
            ))}
          </div>

          {/* Sidebar */}
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 h-fit space-y-4">
            <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
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
