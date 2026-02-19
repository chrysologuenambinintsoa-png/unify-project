'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Trash2, Clock } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface LoginRecord {
  id: string;
  loginAt: string;
  userAgent?: string;
  ipAddress?: string;
}

interface LoginHistoryViewProps {
  userId: string;
}

export default function LoginHistoryView({ userId }: LoginHistoryViewProps) {
  const { data: session } = useSession();
  const [loginHistory, setLoginHistory] = useState<LoginRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLoginHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}/login-history`);
        if (response.ok) {
          const data = await response.json();
          setLoginHistory(data);
        }
      } catch (error) {
        console.error('Error fetching login history:', error);
      } finally {
        setLoading(false);
      }
    };

    if (userId === session?.user?.id) {
      fetchLoginHistory();
    }
  }, [userId, session?.user?.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatBrowser = (userAgent?: string) => {
    if (!userAgent) return 'Navigateur inconnu';
    
    if (userAgent.includes('Chrome')) return 'Google Chrome';
    if (userAgent.includes('Firefox')) return 'Mozilla Firefox';
    if (userAgent.includes('Safari')) return 'Apple Safari';
    if (userAgent.includes('Edge')) return 'Microsoft Edge';
    if (userAgent.includes('Opera')) return 'Opera';
    return 'Autre navigateur';
  };

  const formatDevice = (userAgent?: string) => {
    if (!userAgent) return 'Appareil inconnu';

    // Detect operating system
    let os = 'Système inconnu';
    if (userAgent.includes('Windows')) os = 'Windows';
    else if (userAgent.includes('Mac OS X')) os = 'macOS';
    else if (userAgent.includes('Linux')) os = 'Linux';
    else if (userAgent.includes('Android')) os = 'Android';
    else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';

    // Detect device type
    let deviceType = 'Ordinateur';
    if (userAgent.includes('Mobile') || userAgent.includes('iPhone') || userAgent.includes('Android')) {
      deviceType = 'Téléphone';
    } else if (userAgent.includes('iPad') || userAgent.includes('Tablet')) {
      deviceType = 'Tablette';
    }

    return `${os} ${deviceType}`;
  };



  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Historique des connexions
      </h2>

      {loginHistory.length === 0 ? (
        <Card className="p-6 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            Aucune connexion enregistrée
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {loginHistory.map((login, index) => (
            <motion.div
              key={login.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(login.loginAt)}
                      </p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      {formatBrowser(login.userAgent)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDevice(login.userAgent)}
                    </p>
                    {login.ipAddress && (
                      <p className="text-xs text-gray-500 mt-2">
                        IP: {login.ipAddress}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
