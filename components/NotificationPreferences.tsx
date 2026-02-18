'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, Heart, MessageCircle, UserPlus, Share2, Mail, Volume2, Vibrate } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';

interface NotificationPreference {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  email: boolean;
  push: boolean;
  sound: boolean;
}

export function NotificationPreferences() {
  const { data: session } = useSession();
  const [preferences, setPreferences] = useState<NotificationPreference[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const notificationTypes: NotificationPreference[] = [
    {
      type: 'likes',
      label: 'J\'aimes',
      description: 'Quand quelqu\'un aime votre publication',
      icon: <Heart className="w-5 h-5 text-red-500" />,
      email: true,
      push: true,
      sound: true,
    },
    {
      type: 'comments',
      label: 'Commentaires',
      description: 'Quand quelqu\'un commente votre publication',
      icon: <MessageCircle className="w-5 h-5 text-primary-dark" />,
      email: true,
      push: true,
      sound: true,
    },
    {
      type: 'follows',
      label: 'Nouveaux abonnés',
      description: 'Quand quelqu\'un vous suit',
      icon: <UserPlus className="w-5 h-5 text-green-500" />,
      email: false,
      push: true,
      sound: false,
    },
    {
      type: 'shares',
      label: 'Partages',
      description: 'Quand quelqu\'un partage votre publication',
      icon: <Share2 className="w-5 h-5 text-purple-500" />,
      email: true,
      push: true,
      sound: false,
    },
    {
      type: 'messages',
      label: 'Messages',
      description: 'Quand vous recevez un nouveau message',
      icon: <Mail className="w-5 h-5 text-indigo-500" />,
      email: true,
      push: true,
      sound: true,
    },
  ];

  useEffect(() => {
    setPreferences(notificationTypes);
    // Load from localStorage or API
    const saved = localStorage.getItem('notificationPreferences');
    if (saved) {
      try {
        setPreferences(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved preferences');
      }
    }
  }, []);

  const handleToggle = (type: string, channel: 'email' | 'push' | 'sound') => {
    setPreferences(prev => 
      prev.map(p => 
        p.type === type ? { ...p, [channel]: !p[channel] } : p
      )
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem('notificationPreferences', JSON.stringify(preferences));
      
      // Save to API if needed
      if (session?.user?.id) {
        await fetch('/api/users/notification-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preferences }),
        });
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 px-0 sm:px-0">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Préférences de notification
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Contrôlez comment et quand vous recevez des notifications
        </p>
      </div>

      {/* Preferences List */}
      <div className="space-y-3">
        {preferences.map((pref, index) => (
          <motion.div
            key={pref.type}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
                <div className="flex-shrink-0 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {pref.icon}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{pref.label}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {pref.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0 self-start sm:self-auto">
                  {/* Email Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggle(pref.type, 'email')}
                    className={`p-2 rounded-lg transition-colors ${
                      pref.email
                        ? 'bg-primary-dark dark:bg-primary-dark text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                    title="Email"
                  >
                    <Mail className="w-4 h-4" />
                  </motion.button>

                  {/* Push Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggle(pref.type, 'push')}
                    className={`p-2 rounded-lg transition-colors ${
                      pref.push
                        ? 'bg-primary-dark dark:bg-primary-dark text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                    title="Notifications push"
                  >
                    <Bell className="w-4 h-4" />
                  </motion.button>

                  {/* Sound Toggle */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleToggle(pref.type, 'sound')}
                    className={`p-2 rounded-lg transition-colors ${
                      pref.sound
                        ? 'bg-primary-dark dark:bg-primary-dark text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                    title="Son"
                  >
                    <Volume2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 sm:flex-initial bg-primary-dark text-white hover:bg-primary-light"
        >
          {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
        </Button>

        {savedSuccess && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex items-center gap-2 text-green-600 dark:text-green-400 mt-3 sm:mt-0"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-sm font-medium">Préférences enregistrées</span>
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <Card className="bg-primary-dark dark:bg-primary-dark border-0 p-4 mt-6">
        <h4 className="font-semibold text-white mb-3 text-sm sm:text-base">Canaux de notification</h4>
        <div className="space-y-2 text-xs sm:text-sm text-white/80">
          <div className="flex items-center gap-2">
            <Mail className="w-3 sm:w-4 h-3 sm:h-4 text-white/60 flex-shrink-0" />
            <span>Email - Reçu par email</span>
          </div>
          <div className="flex items-center gap-2">
            <Bell className="w-3 sm:w-4 h-3 sm:h-4 text-white/60 flex-shrink-0" />
            <span>Notifications push - Sur l'application et dans le navigateur</span>
          </div>
          <div className="flex items-center gap-2">
            <Volume2 className="w-3 sm:w-4 h-3 sm:h-4 text-white/60 flex-shrink-0" />
            <span>Son - Avec notification sonore</span>
          </div>
        </div>
      </Card>
    </div>
  );
}
