'use client';

import { motion } from 'framer-motion';

interface SkeletonCardProps {
  count?: number;
  className?: string;
  cardWidth?: string;
}

export function CardsSkeleton({ count = 5, className = '', cardWidth = 'w-40' }: SkeletonCardProps) {
  return (
    <div className={`flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, repeat: Infinity }}
          className={`flex-shrink-0 ${cardWidth} h-52 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-xl p-3`}
        >
          <div className="space-y-3 h-full">
            <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4" />
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full" />
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6" />
            </div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-full" />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
