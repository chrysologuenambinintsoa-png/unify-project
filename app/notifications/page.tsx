'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/NotificationItem';
import { motion } from 'framer-motion';
import { Bell, Settings, CheckCheck } from 'lucide-react';

export default function NotificationsPage() {
  const { translation } = useLanguage();
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead
  } = useNotifications();

  // No filters: show all notifications in a unified feed

  const handleMarkAllAsReadClick = async () => {
    setIsMarkingAll(true);
    try {
      await markAllAsRead();
    } finally {
      setIsMarkingAll(false);
    }
  };

  const getActionLink = (notification: any) => {
    // Always prefer explicit URL from server (provides complete flexibility for content routing)
    if (notification.url) {
      return notification.url;
    }

    // Fallback: Generate URLs based on notification type
    // These routes should handle dynamic content viewing (photo viewer, post viewer, etc.)
    switch (notification.type) {
      // Post-related notifications
      case 'like':
      case 'comment':
      case 'post':
      case 'mention': {
        const postId = notification.targetId || notification.postId;
        if (postId) return `/posts/${postId}`;
        break;
      }

      // Story-related notifications
      case 'story':
      case 'story_reply': {
        const storyId = notification.targetId || notification.storyId;
        if (storyId) return `/stories/${storyId}`;
        break;
      }

      // Photo gallery or media notifications
      case 'photo':
      case 'media': {
        const photoId = notification.targetId || notification.photoId;
        if (photoId) return `/posts/photo/${photoId}`;
        break;
      }

      // User-related notifications
      case 'follow':
      case 'friend_request': {
        const userId = notification.user?.id || notification.actorId;
        if (userId) return `/users/${userId}/profile`;
        break;
      }

      // Message/conversation notifications
      case 'message': {
        const conversationId = notification.targetId || notification.conversationId;
        const userId = notification.user?.id || notification.actorId;
        if (conversationId) return `/messages/${conversationId}`;
        if (userId) return `/messages?userId=${userId}`;
        break;
      }

      // Group notifications
      case 'group':
      case 'group_invite': {
        const groupId = notification.targetId || notification.groupId;
        if (groupId) return `/groups/${groupId}`;
        break;
      }

      // Page notifications
      case 'page': {
        const pageId = notification.targetId || notification.pageId;
        if (pageId) return `/pages/${pageId}`;
        break;
      }

      // Badge notifications
      case 'badge': {
        return `/profile/badges`;
      }

      default:
        break;
    }

    // Default fallback
    return '/';
  };

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
          <div className="max-w-2xl mx-auto">
          {/* Header */}
            <div className="flex items-center justify-between mb-6 px-4 sm:px-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {translation.nav.notifications}
              </h1>
              {unreadCount > 0 && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-gray-600 mt-1"
                >
                    {unreadCount} {unreadCount === 1 ? 'nouvelle notification' : 'nouvelles notifications'}
                </motion.p>
              )}
            </div>
              {unreadCount > 0 && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleMarkAllAsReadClick}
                  disabled={isMarkingAll}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCheck className="w-4 h-4" />
                  {isMarkingAll ? 'Marquage...' : 'Tout marquer comme lu'}
                </motion.button>
              )}
          </div>



          {/* Notifications List */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Chargement des notifications...</p>
            </div>
          ) : error ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12 px-4"
            >
              <p className="text-red-500">{error}</p>
            </motion.div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-gray-200 bg-white rounded-lg shadow-sm overflow-hidden">
              {notifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <NotificationItem
                    id={notification.id}
                    type={notification.type}
                    user={notification.user}
                    content={notification.content}
                    time={notification.time}
                    read={notification.read}
                    onRead={markAsRead}
                    actionLink={getActionLink(notification)}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16 px-4"
            >
              <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {translation.pageLabels?.noNotifications || 'No notifications'}
              </h3>
              <p className="text-gray-500">
                Vous n'avez pas de notifications pour le moment.
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </MainLayout>
  );
}

