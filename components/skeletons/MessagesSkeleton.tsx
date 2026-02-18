'use client';

import React from 'react';
import { motion } from 'framer-motion';

export function MessagesSkeleton() {
  return (
    <div className="py-6">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex">
          {/* Left Sidebar - Conversations List */}
          <motion.div
            className="w-full md:w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="h-8 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-3" />
            </div>

            {/* Conversation Items */}
            <div className="flex-1 overflow-y-auto space-y-1">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="p-3 space-y-3 border-b border-gray-100 dark:border-gray-800"
                >
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-full bg-gray-300 dark:bg-gray-700 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Side - Chat Area (Hidden on Mobile) */}
          <div className="hidden md:flex flex-1 flex-col">
            {/* Chat Header */}
            <motion.div
              className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
                </div>
              </div>
            </motion.div>

            {/* Messages Area */}
            <motion.div
              className="flex-1 p-4 space-y-4 overflow-y-auto"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            >
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-xs ${
                      i % 2 === 0
                        ? 'bg-gray-200 dark:bg-gray-700'
                        : 'bg-blue-200 dark:bg-blue-900'
                    } rounded-lg p-4 w-32 h-12`}
                  />
                </div>
              ))}
            </motion.div>

            {/* Message Input */}
            <motion.div
              className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
            >
              <div className="h-12 bg-gray-300 dark:bg-gray-700 rounded-lg" />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
