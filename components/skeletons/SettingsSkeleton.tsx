'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function SettingsSkeleton() {
  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4">
        {/* Title */}
        <motion.div
          className="h-8 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-6"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Settings Menu */}
          <motion.div
            className="space-y-2"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-full bg-gray-300 dark:bg-gray-700 rounded" />
            ))}
          </motion.div>

          {/* Main Content */}
          <motion.div
            className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-lg p-6 space-y-6"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
          >
            {/* Section Title */}
            <div className="h-6 w-40 bg-gray-300 dark:bg-gray-700 rounded" />

            {/* Settings Items */}
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="border-b border-gray-200 dark:border-gray-700 pb-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
                    <div className="h-3 w-48 bg-gray-300 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="h-6 w-12 bg-gray-300 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
              <div className="h-10 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
