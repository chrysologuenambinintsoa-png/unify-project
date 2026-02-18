'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCheck, Settings, Clock, Heart, MessageCircle, UserPlus, Share2, Flag, Eye } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { useNotifications } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/Button';

export function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'this_week'>('all');
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Filter notifications
  const filteredNotifications = notifications.filter(notif => {
    // Exclude message notifications - they have their own Messages section
    if (notif.type === 'message') return false;
    
    if (filter === 'unread') return !notif.read;
    if (filter === 'this_week') {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return new Date(notif.time) > weekAgo;
    }
    return true;
  });

  const handleMarkAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    setIsOpen(false);
    
    // Navigate to action link
    if (notification.url) {
      router.push(notification.url);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
      case 'friend_request':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'share':
        return <Share2 className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'À l\'instant';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}j`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="md:relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-1.5 rounded-full bg-primary-dark dark:bg-primary-dark hover:bg-primary-light dark:hover:bg-primary-light transition-colors"
      >
        <Bell className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed md:absolute top-16 md:top-full left-4 md:left-auto right-4 md:right-0 bottom-auto md:bottom-auto w-[calc(100%-32px)] md:w-96 max-h-[45vh] md:max-h-[450px] rounded-b-2xl md:rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)'
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary-dark to-primary-light dark:from-primary-dark dark:to-primary-dark px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm sm:text-lg font-bold text-white truncate">Notifications</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-primary-light dark:hover:bg-primary-light rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
                </motion.button>
              </div>

              {/* Filters */}
              <div className="flex gap-1.5 sm:gap-2 mt-3 sm:mt-4 overflow-x-auto pb-2">
                {(['all', 'unread', 'this_week'] as const).map((f) => (
                  <motion.button
                    key={f}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setFilter(f)}
                    className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-shrink-0 ${
                      filter === f
                        ? 'bg-white text-primary-dark shadow-md'
                        : 'bg-primary-light dark:bg-primary-dark text-white hover:bg-primary-dark dark:hover:bg-primary-light'
                    }`}
                  >
                    {f === 'all' && 'Tous'}
                    {f === 'unread' && `Non lus (${unreadCount})`}
                    {f === 'this_week' && 'Cette semaine'}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto" style={{ maxHeight: 'calc(45vh - 160px)' }}>
              {error ? (
                <div className="p-4 sm:p-6 text-center">
                  <Flag className="w-8 sm:w-12 h-8 sm:h-12 text-red-500 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-red-600 dark:text-red-400 mb-3">{error}</p>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => fetchNotifications()}
                    className="text-xs sm:text-sm px-3 py-1.5 bg-primary-dark hover:bg-primary-light text-white rounded-lg transition-colors"
                  >
                    Réessayer
                  </motion.button>
                </div>
              ) : loading ? (
                <div className="space-y-1 p-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-10 bg-gray-100 dark:bg-gray-800 rounded animate-pulse opacity-50" />
                  ))}
                </div>
              ) : filteredNotifications.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredNotifications.slice(0, 10).map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleNotificationClick(notification)}
                      className={`px-2 sm:px-4 py-2 sm:py-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer flex items-start gap-2 sm:gap-3 ${
                        !notification.read ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        <Avatar src={notification.user?.avatar || null} name={notification.user?.fullName} userId={notification.user?.id} size="sm" className="w-8 h-8 sm:w-10 sm:h-10" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-900 dark:text-white line-clamp-2">
                          <span className="font-semibold">{notification.user?.fullName}</span>
                          <span className="text-gray-700 dark:text-gray-400"> {notification.content}</span>
                        </p>
                        <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{formatTime(notification.time)}</span>
                          {notification.type && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">•</span>
                          )}
                          <span className="text-xs text-gray-400 dark:text-gray-500">{notification.type}</span>
                        </div>
                      </div>

                      {/* Icon & Unread Indicator */}
                      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                        {!notification.read && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2 sm:w-2.5 h-2 sm:h-2.5 bg-blue-500 rounded-full"
                          />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="px-4 sm:px-6 py-8 sm:py-12 text-center">
                  <Bell className="w-8 sm:w-12 h-8 sm:h-12 text-gray-300 dark:text-gray-600 mx-auto mb-2 sm:mb-3" />
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Aucune notification</p>
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 px-3 sm:px-6 py-2 sm:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                {unreadCount > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleMarkAllAsRead}
                    disabled={isMarkingAll}
                    className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200 transition-colors disabled:opacity-50 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                    {isMarkingAll ? 'Marquage...' : 'Tout marquer comme lu'}
                  </motion.button>
                )}
                <Link href="/notifications" className="flex-1 sm:flex-initial sm:ml-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors w-full sm:w-auto"
                  >
                    Voir tous
                  </motion.button>
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
