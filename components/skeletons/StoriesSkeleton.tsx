'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function StoriesSkeleton() {
  return (
    <div className="py-6">
      {/* Story Viewer Container */}
      <motion.div
        className="max-w-md w-full h-[600px] md:rounded-xl overflow-hidden bg-gray-900 mx-auto"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {/* Story Background/Image */}
        <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
          {/* Play Icon Placeholder */}
          <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
            <div className="w-6 h-6 bg-gray-600 rounded-full" />
          </div>
        </div>

        {/* Story Header */}
        <motion.div
          className="absolute top-0 left-0 right-0 p-4 z-10"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-700" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-24 bg-gray-700 rounded" />
              <div className="h-2 w-32 bg-gray-700 rounded" />
            </div>
            <div className="w-6 h-6 bg-gray-700 rounded" />
          </div>

          {/* Progress Bar */}
          <div className="mt-2 h-1 w-full bg-gray-700 rounded-full" />
        </motion.div>

        {/* Story Controls */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 p-4 space-y-3 z-10"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
        >
          {/* Comment Input */}
          <div className="h-10 bg-gray-700 rounded-full" />

          {/* Buttons */}
          <div className="flex gap-2">
            <div className="flex-1 h-8 bg-gray-700 rounded" />
            <div className="flex-1 h-8 bg-gray-700 rounded" />
            <div className="flex-1 h-8 bg-gray-700 rounded" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
