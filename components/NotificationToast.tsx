'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, UserPlus, Share2, Trophy, Gift } from 'lucide-react';
import Image from 'next/image';

interface NotificationToastProps {
  type: 'like' | 'comment' | 'follow' | 'share' | 'achievement' | 'gift';
  user?: {
    name: string;
    avatar: string;
  };
  message: string;
  onDismiss?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function NotificationToast({
  type,
  user,
  message,
  onDismiss,
  autoClose = true,
  duration = 4000,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoClose && duration) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onDismiss]);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'share':
        return <Share2 className="w-5 h-5 text-purple-500" />;
      case 'achievement':
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 'gift':
        return <Gift className="w-5 h-5 text-pink-500" />;
      default:
        return null;
    }
  };

  const getColor = () => {
    switch (type) {
      case 'like':
        return 'from-red-50 to-red-100/50 dark:from-red-900/20 dark:to-red-900/10 border-red-200 dark:border-red-800/50';
      case 'comment':
        return 'from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800/50';
      case 'follow':
        return 'from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 border-green-200 dark:border-green-800/50';
      case 'share':
        return 'from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 border-purple-200 dark:border-purple-800/50';
      case 'achievement':
        return 'from-yellow-50 to-yellow-100/50 dark:from-yellow-900/20 dark:to-yellow-900/10 border-yellow-200 dark:border-yellow-800/50';
      case 'gift':
        return 'from-pink-50 to-pink-100/50 dark:from-pink-900/20 dark:to-pink-900/10 border-pink-200 dark:border-pink-800/50';
      default:
        return 'from-gray-50 to-gray-100/50 dark:from-gray-800 dark:to-gray-900';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className={`bg-gradient-to-r ${getColor()} border rounded-lg p-4 shadow-lg flex items-center gap-3`}
    >
      <div className="flex-shrink-0">
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-white">
          {user && (
            <>
              <span className="font-semibold">{user.name}</span>
              <span className="text-gray-700 dark:text-gray-400"> {message}</span>
            </>
          )}
          {!user && <span className="font-medium">{message}</span>}
        </p>
      </div>

      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsVisible(false);
          onDismiss?.();
        }}
        className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
      >
        <span className="sr-only">Fermer</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </motion.button>
    </motion.div>
  );
}
