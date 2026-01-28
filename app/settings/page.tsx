'use client';

import React, { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Settings, User, Bell, Shield, Palette, Globe } from 'lucide-react';
import { AvatarUpload } from '@/components/AvatarUpload';
import { useSession } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { translation, language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'notifications' | 'appearance'>('general');

  const tabs = [
    { key: 'general', icon: User, label: translation.settings.general },
    { key: 'privacy', icon: Shield, label: translation.settings.privacy },
    { key: 'notifications', icon: Bell, label: translation.settings.notifications },
    { key: 'appearance', icon: Palette, label: translation.settings.appearance },
  ];

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'mg', name: 'Malagasy', flag: '🇲🇬' },
    { code: 'ch', name: '中文', flag: '🇨🇳' },
  ];

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {translation.settings.settings}
          </h1>
          <p className="text-gray-600">
            Gérez vos préférences et paramètres de compte
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 border-r border-gray-200">
              <nav className="p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        activeTab === tab.key
                          ? 'bg-primary/10 text-primary'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {activeTab === 'general' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900">
                    {translation.settings.general}
                  </h2>

                  {/* Avatar Section */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-md font-medium text-gray-900 mb-4">
                      Photo de profil
                    </h3>
                    <div className="flex justify-center">
                      <AvatarUpload
                        currentAvatar={session?.user?.avatar}
                        size="xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {translation.settings.language}
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {languages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nom d'utilisateur
                      </label>
                      <input
                        type="text"
                        defaultValue="john_doe"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        defaultValue="john@example.com"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        rows={3}
                        defaultValue="Software developer | Tech enthusiast"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors">
                      Enregistrer les modifications
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === 'privacy' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900">
                    {translation.settings.privacy}
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Profil privé
                        </h3>
                        <p className="text-sm text-gray-500">
                          Seules les personnes que vous approuvez peuvent voir vos publications
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Messages privés
                        </h3>
                        <p className="text-sm text-gray-500">
                          Contrôler qui peut vous envoyer des messages
                        </p>
                      </div>
                      <select className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
                        <option>Tous les utilisateurs</option>
                        <option>Amis uniquement</option>
                        <option>Personne</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Activité en ligne
                        </h3>
                        <p className="text-sm text-gray-500">
                          Afficher quand vous êtes en ligne
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900">
                    {translation.settings.notifications}
                  </h2>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Notifications push
                        </h3>
                        <p className="text-sm text-gray-500">
                          Recevoir des notifications sur votre appareil
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Likes et réactions
                        </h3>
                        <p className="text-sm text-gray-500">
                          Quand quelqu'un aime ou réagit à vos publications
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Commentaires
                        </h3>
                        <p className="text-sm text-gray-500">
                          Quand quelqu'un commente vos publications
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          Nouveaux abonnés
                        </h3>
                        <p className="text-sm text-gray-500">
                          Quand quelqu'un commence à vous suivre
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" defaultChecked />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'appearance' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900">
                    {translation.settings.appearance}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        {translation.settings.theme}
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors">
                          <div className="w-full h-16 bg-white border border-gray-200 rounded mb-2"></div>
                          <span className="text-sm font-medium">Clair</span>
                        </button>
                        <button className="p-4 border-2 border-primary rounded-lg">
                          <div className="w-full h-16 bg-gray-900 rounded mb-2"></div>
                          <span className="text-sm font-medium">Sombre</span>
                        </button>
                        <button className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary transition-colors">
                          <div className="w-full h-16 bg-gradient-to-r from-white to-gray-900 rounded mb-2"></div>
                          <span className="text-sm font-medium">Auto</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </MainLayout>
  );
}