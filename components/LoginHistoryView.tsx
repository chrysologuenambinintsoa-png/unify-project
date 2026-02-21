'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Clock, Shield, LogOut } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface LoginRecord {
  id: string;
  loginAt: string;
  userAgent?: string;
  ipAddress?: string;
}

interface DeviceSession {
  deviceFingerprint: string;
  isCurrent: boolean;
  latestLogin: LoginRecord;
  totalLogins: number;
  allLogins: LoginRecord[];
}

interface LoginHistoryViewProps {
  userId: string;
}

export default function LoginHistoryView({ userId }: LoginHistoryViewProps) {
  const { data: session } = useSession();
  const [deviceSessions, setDeviceSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);

  useEffect(() => {
    const fetchLoginHistory = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}/login-history`);
        if (response.ok) {
          const data = await response.json();
          setDeviceSessions(data);
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

  const parseDeviceFingerprint = (fingerprint: string) => {
    const parts = fingerprint.split('-');
    return {
      os: parts[0] || 'unknown',
      browser: parts[1] || 'unknown',
      deviceType: parts[2] || 'pc',
    };
  };

  const formatBrowser = (browser?: string) => {
    if (!browser || browser === 'unknown') return 'Navigateur inconnu';

    const browsers: Record<string, string> = {
      chrome: 'Google Chrome',
      firefox: 'Mozilla Firefox',
      safari: 'Apple Safari',
      edge: 'Microsoft Edge',
      opera: 'Opera',
    };

    return browsers[browser] || 'Autre navigateur';
  };

  const formatDevice = (os?: string, deviceType?: string) => {
    if (!os || os === 'unknown') return 'Appareil inconnu';

    const osNames: Record<string, string> = {
      windows: 'Windows',
      macos: 'macOS',
      linux: 'Linux',
      android: 'Android',
      ios: 'iOS',
    };

    const deviceTypes: Record<string, string> = {
      pc: 'Ordinateur',
      mobile: 'Téléphone',
      tablet: 'Tablette',
    };

    const osName = osNames[os] || 'Système inconnu';
    const deviceTypeName = deviceType ? (deviceTypes[deviceType] || 'Appareil') : 'Appareil';
    return `${osName} (${deviceTypeName})`;
  };

  const revokeSession = async (deviceFingerprint: string) => {
    if (confirm('Êtes-vous sûr de vouloir déconnecter cet appareil ? Vous devrez vous reconnecter.')) {
      try {
        setRevoking(deviceFingerprint);
        const response = await fetch(`/api/users/${userId}/login-history`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceFingerprint }),
        });

        if (response.ok) {
          setDeviceSessions((prev) => prev.filter((s) => s.deviceFingerprint !== deviceFingerprint));
        } else {
          alert('Erreur lors de la révocation de la session');
        }
      } catch (error) {
        console.error('Error revoking session:', error);
        alert('Erreur lors de la révocation de la session');
      } finally {
        setRevoking(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Chargement...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Historique des connexions</h2>

      {deviceSessions.length === 0 ? (
        <Card className="p-6 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Aucune connexion enregistrée</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {deviceSessions.map((deviceSession, index) => {
            const { os, browser, deviceType } = parseDeviceFingerprint(deviceSession.deviceFingerprint);

            return (
              <motion.div
                key={deviceSession.deviceFingerprint}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`p-6 hover:shadow-md transition-all ${
                    deviceSession.isCurrent ? 'border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {deviceSession.isCurrent && (
                        <div className="flex items-center gap-2 mb-3">
                          <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-semibold text-green-600 dark:text-green-400">Appareil actuel</span>
                        </div>
                      )}

                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                          {formatDevice(os, deviceType)}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatBrowser(browser)}</p>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          Dernière connexion: <span className="font-medium">{formatDate(deviceSession.latestLogin.loginAt)}</span>
                        </p>
                      </div>

                      <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                        {deviceSession.latestLogin.ipAddress && (
                          <p>
                            IP: <span className="font-mono">{deviceSession.latestLogin.ipAddress}</span>
                          </p>
                        )}
                        <p>
                          Connexions: <span className="font-semibold">{deviceSession.totalLogins}</span>
                        </p>
                      </div>

                      {deviceSession.allLogins.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Dernières connexions:</p>
                          <div className="space-y-1">
                            {deviceSession.allLogins.slice(1, 4).map((login) => (
                              <p key={login.id} className="text-xs text-gray-500 dark:text-gray-500">
                                • {formatDate(login.loginAt)}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => revokeSession(deviceSession.deviceFingerprint)}
                      disabled={deviceSession.isCurrent || revoking === deviceSession.deviceFingerprint}
                      className={`ml-4 p-2 rounded-lg transition-all flex-shrink-0 ${
                        deviceSession.isCurrent
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                      }`}
                      title={
                        deviceSession.isCurrent ? "Impossible de déconnecter l'appareil actuel" : 'Déconnecter cet appareil'
                      }
                    >
                      {revoking === deviceSession.deviceFingerprint ? (
                        <Clock className="w-5 h-5 animate-spin" />
                      ) : (
                        <LogOut className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
