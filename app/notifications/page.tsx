'use client';

import React, { useState, useEffect } from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Settings, CheckCheck, Heart, MessageCircle, UserPlus, Share2, Search, Filter, Download, Trash2, Archive } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { useRouter } from 'next/navigation';

type FilterType = 'all' | 'unread' | 'likes' | 'comments' | 'follows' | 'messages';

export default function NotificationsPage() {
  const { isReady, session } = useRequireAuth();
  const { translation } = useLanguage();
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  if (!isReady) {
    return (
      <MainLayout>
        <div className="max-w-4xl mx-auto py-6">
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  // Filter notifications
  let filteredNotifications = notifications.filter(notif => {
    // Filter by type
    if (filter !== 'all' && filter !== 'unread') {
      switch (filter) {
        case 'likes':
          return notif.type === 'like';
        case 'comments':
          return notif.type === 'comment';
        case 'follows':
          return ['follow', 'friend_request'].includes(notif.type);
        case 'messages':
          return notif.type === 'message';
        default:
          return true;
      }
    }

    // Filter unread
    if (filter === 'unread' && notif.read) return false;

    return true;
  });

  // Filter by search query
  if (searchQuery.trim()) {
    filteredNotifications = filteredNotifications.filter(notif =>
      notif.user?.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notif.content.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  const handleMarkAllAsReadClick = async () => {
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
    if (notification.url) {
      router.push(notification.url);
    }
  };

  const handleSelectAll = () => {
    if (selectedNotifications.size === filteredNotifications.length) {
      setSelectedNotifications(new Set());
    } else {
      setSelectedNotifications(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedNotifications);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedNotifications(newSelected);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-6 h-6 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-6 h-6 text-blue-500" />;
      case 'follow':
      case 'friend_request':
        return <UserPlus className="w-6 h-6 text-green-500" />;
      case 'share':
        return <Share2 className="w-6 h-6 text-purple-500" />;
      case 'message':
        return <MessageCircle className="w-6 h-6 text-indigo-500" />;
      default:
        return <Bell className="w-6 h-6 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'like':
        return 'from-red-50 to-red-100/50 dark:from-red-900/10 dark:to-red-900/5';
      case 'comment':
        return 'from-blue-50 to-blue-100/50 dark:from-blue-900/10 dark:to-blue-900/5';
      case 'follow':
      case 'friend_request':
        return 'from-green-50 to-green-100/50 dark:from-green-900/10 dark:to-green-900/5';
      case 'message':
        return 'from-indigo-50 to-indigo-100/50 dark:from-indigo-900/10 dark:to-indigo-900/5';
      default:
        return 'from-gray-50 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-900/50';
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

  const filterOptions: { value: FilterType; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'Tous', icon: <Bell className="w-4 h-4" /> },
    { value: 'unread', label: `Non lus (${unreadCount})`, icon: <Bell className="w-4 h-4" /> },
    { value: 'likes', label: 'J\'aimes', icon: <Heart className="w-4 h-4" /> },
    { value: 'comments', label: 'Commentaires', icon: <MessageCircle className="w-4 h-4" /> },
    { value: 'follows', label: 'Amis', icon: <UserPlus className="w-4 h-4" /> },
    { value: 'messages', label: 'Messages', icon: <MessageCircle className="w-4 h-4" /> },
  ];

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-5xl mx-auto py-6 px-4 sm:px-6 md:px-8"
      >
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {translation.nav.notifications || 'Notifications'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {filteredNotifications.length} notification{filteredNotifications.length !== 1 ? 's' : ''}
              </p>
            </div>
            {unreadCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleMarkAllAsReadClick}
                disabled={isMarkingAll}
                className="flex items-center gap-2 px-4 py-2 bg-primary-dark hover:bg-primary-light text-white font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <CheckCheck className="w-4 h-4" />
                {isMarkingAll ? 'Marquage...' : 'Tout marquer comme lu'}
              </motion.button>
            )}
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans les notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {filterOptions.map((option) => (
            <motion.button
              key={option.value}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-full font-medium flex items-center gap-2 whitespace-nowrap transition-all ${
                filter === option.value
                  ? 'bg-primary-dark text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              {option.icon}
              {option.label}
            </motion.button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <Card className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </Card>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-3">
            {/* Select All Option */}
            {filteredNotifications.length > 1 && (
              <div className="flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <input
                  type="checkbox"
                  checked={selectedNotifications.size === filteredNotifications.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded"
                />
                <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                  Sélectionner tous ({selectedNotifications.size}/{filteredNotifications.length})
                </span>
              </div>
            )}

            {/* Notifications List */}
            <AnimatePresence>
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleNotificationClick(notification)}
                  className={`group relative p-4 rounded-xl border transition-all cursor-pointer ${
                    !notification.read
                      ? 'bg-gradient-to-r border-blue-200 dark:border-blue-800/50 shadow-md'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
                  } ${getNotificationColor(notification.type)}`}
                >
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedNotifications.has(notification.id)}
                    onChange={() => handleToggleSelect(notification.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute top-4 right-4 w-4 h-4 rounded"
                  />

                  <div className="flex gap-4 pr-8">
                    {/* Avatar */}
                    <Link href={`/users/${notification.user?.id}/profile`}>
                      <div className="relative flex-shrink-0 hover:ring-2 hover:ring-blue-400 transition-all rounded-full">
                        <Avatar src={notification.user?.avatar || null} name={notification.user?.fullName} userId={notification.user?.id} size="sm" className="w-12 h-12" />
                      </div>
                    </Link>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">
                        <Link href={`/users/${notification.user?.id}/profile`}>
                          <span className="font-semibold hover:underline">{notification.user?.fullName}</span>
                        </Link>
                        <span className="text-gray-700 dark:text-gray-400"> {notification.content}</span>
                      </p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs text-gray-500 dark:text-gray-500">{formatTime(notification.time)}</span>
                        <span className="text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full capitalize">
                          {notification.type === 'friend_request' ? 'Demande d\'ami' : notification.type}
                        </span>
                      </div>
                    </div>

                    {/* Icon */}
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-white dark:bg-gray-700/50 rounded-lg group-hover:bg-gray-100 dark:group-hover:bg-gray-700 transition-colors">
                        {getNotificationIcon(notification.type)}
                      </div>
                    </div>
                  </div>

                  {/* Unread Indicator */}
                  {!notification.read && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-500 rounded-full"
                    />
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <Card className="bg-gradient-to-br from-primary-dark to-primary-light dark:from-primary-dark dark:to-primary-dark border-0 p-8 sm:p-12 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
            >
              <Bell className="w-12 sm:w-16 h-12 sm:h-16 text-white/80 mx-auto mb-4" />
            </motion.div>
            <h3 className="text-lg font-semibold text-white mb-2">
              Aucune notification
            </h3>
            <p className="text-white/70 mb-6">
              {filter === 'unread' 
                ? 'Vous êtes à jour !'
                : 'Vous n\'avez pas de notifications pour le moment.'}
            </p>
            {filter !== 'all' && (
              <Button
                onClick={() => setFilter('all')}
                className="bg-white text-primary-dark hover:bg-gray-100"
              >
                Voir toutes les notifications
              </Button>
            )}
          </Card>
        )}
      </motion.div>
    </MainLayout>
  );
}

