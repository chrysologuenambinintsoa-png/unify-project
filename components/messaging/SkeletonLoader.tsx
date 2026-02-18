'use client';

import React from 'react';
import { motion } from 'framer-motion';

export const ConversationListSkeleton: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-primary-dark">
      {/* Header Skeleton */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
        </div>

        {/* Search Skeleton */}
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
      </div>

      {/* Conversations List Skeleton */}
      <div className="flex-1 overflow-y-auto space-y-2 p-2">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0.6 }}
            animate={{ opacity: [0.6, 0.8, 0.6] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
            className="px-4 py-3 flex items-center gap-3 border-l-4 border-transparent"
          >
            {/* Avatar Skeleton */}
            <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

            {/* Text Skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>

            {/* Time Skeleton */}
            <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded ml-2 flex-shrink-0" />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const MessageBubbleSkeleton: React.FC = () => {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: [0.6, 0.8, 0.6] }}
      transition={{ duration: 1.5, repeat: Infinity }}
      className="mb-4"
    >
      {/* Message bubble skeleton */}
      <div className="flex gap-3 mb-2">
        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 space-y-2 max-w-xs">
          <div className="h-4 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    </motion.div>
  );
};

export const MessagesAreaSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header Skeleton */}
      <motion.div
        initial={{ opacity: 0.6 }}
        animate={{ opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          <div className="flex gap-2">
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
            <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-700" />
          </div>
        </div>
      </motion.div>

      {/* Messages Skeleton */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <MessageBubbleSkeleton key={i} />
        ))}
      </div>

      {/* Input Skeleton */}
      <motion.div
        initial={{ opacity: 0.6 }}
        animate={{ opacity: [0.6, 0.8, 0.6] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-3"
      >
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded-lg" />
      </motion.div>
    </div>
  );
};
