'use client';

import React from 'react';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { motion } from 'framer-motion';
import { Bell, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { NotificationPreferences } from '@/components/NotificationPreferences';

export default function NotificationSettingsPage() {
  const { isReady } = useRequireAuth();

  if (!isReady) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto py-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl mx-auto py-6 px-4 sm:px-6 md:px-8"
      >
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <Link href="/settings">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Bell className="w-6 sm:w-8 h-6 sm:h-8 text-primary-dark" />
              Paramètres de notification
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Gérez comment vous recevez les notifications
            </p>
          </div>
        </div>

        {/* Content */}
        <NotificationPreferences />
      </motion.div>
    </MainLayout>
  );
}
