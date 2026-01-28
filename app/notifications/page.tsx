'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, AtSign, Settings } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  content: string;
  time: string;
  read: boolean;
}

export default function NotificationsPage() {
  const { translation } = useLanguage();
  const [activeFilter, setActiveFilter] = useState<'all' | 'mentions' | 'likes' | 'comments' | 'follows'>('all');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-red-500" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const filteredNotifications = activeFilter === 'all'
    ? notifications
    : notifications.filter(n => {
        if (activeFilter === 'mentions') return n.type === 'mention';
        if (activeFilter === 'likes') return n.type === 'like';
        if (activeFilter === 'comments') return n.type === 'comment';
        if (activeFilter === 'follows') return n.type === 'follow';
        return true;
      });

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {translation.nav.notifications}
            </h1>
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Settings className="w-5 h-5" />
            </button>
          </div>

          {/* Filters */}
          <div className="flex space-x-2 mb-6 overflow-x-auto">
            {[
              { key: 'all', label: 'Tout' },
              { key: 'mentions', label: 'Mentions' },
              { key: 'likes', label: 'Likes' },
              { key: 'comments', label: 'Commentaires' },
              { key: 'follows', label: 'Abonnements' },
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Mark all as read button */}
          <div className="flex justify-end mb-4">
            <button className="text-sm text-primary hover:text-primary-light transition-colors">
              Tout marquer comme lu
            </button>
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Chargement...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer ${
                    notification.read
                      ? 'bg-white border-gray-200'
                      : 'bg-blue-50 border-blue-200'
                  } hover:bg-gray-50`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <img
                          src={notification.user.avatar}
                          alt={notification.user.fullName}
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{notification.user.fullName}</span>{' '}
                            {notification.content}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.time).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {!loading && !error && filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucune notification
              </h3>
              <p className="text-gray-500">
                Vous n'avez pas de notifications pour le moment.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </MainLayout>
  );
}