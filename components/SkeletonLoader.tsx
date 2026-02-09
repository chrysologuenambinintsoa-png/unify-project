'use client';

import { Loader } from 'lucide-react';
import { motion } from 'framer-motion';

interface SkeletonLoaderProps {
  count?: number;
  message?: string;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ count = 3, message = 'Chargement...' }) => {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="bg-gray-200 dark:bg-gray-800 rounded-lg h-24"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      ))}
      {message && (
        <div className="text-center py-8">
          <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
          <p className="text-gray-600 dark:text-gray-400 text-sm">{message}</p>
        </div>
      )}
    </div>
  );
};
