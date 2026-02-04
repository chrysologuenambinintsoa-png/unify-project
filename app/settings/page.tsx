'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { Settings, User, Bell, Shield, Palette, Globe, Loader2, CheckCircle, Lock, Smartphone, LogOut, Key, Plus, Trash2 } from 'lucide-react';
import { AvatarUpload } from '@/components/AvatarUpload';
import { CoverImageUpload } from '@/components/CoverImageUpload';
import { useSession, signOut } from 'next-auth/react';
import LoginHistoryView from '@/components/LoginHistoryView';
import SavedDevicesView from '@/components/SavedDevicesView';

export default function SettingsPage() {
  const { data: session, update: updateSession } = useSession();
  const { translation, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  
  const [activeSection, setActiveSection] = useState<'general' | 'account'>('general');
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'notifications' | 'appearance' | 'password' | 'linked-accounts' | 'delete-account' | 'login-history' | 'saved-devices'>('general');
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    coverImage: '',
    dateOfBirth: '',
    originCity: '',
    currentCity: '',
  });
  
  const [privacySettings, setPrivacySettings] = useState({
    allowMessages: 'everyone',
    showOnlineStatus: true,
  });
  
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    likes: true,
    comments: true,
    followers: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [deleteConfirm, setDeleteConfirm] = useState({
    password: '',
    confirmDelete: false,
  });

  // Fetch user profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/users/profile');
        if (response.ok) {
          const data = await response.json();
          setFormData({
            fullName: data.fullName || '',
            bio: data.bio || '',
            coverImage: data.coverImage || '',
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
            originCity: data.originCity || '',
            currentCity: data.currentCity || '',
          });
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    if (session?.user?.id) {
      fetchProfile();
    }
  }, [session?.user?.id]);

  const generalTabs = [
    { key: 'general', icon: User, label: translation.settings.general },
    { key: 'privacy', icon: Shield, label: translation.settings.privacy },
    { key: 'notifications', icon: Bell, label: translation.settings.notifications },
    { key: 'appearance', icon: Palette, label: translation.settings.appearance },
  ];

  const accountTabs = [
    { key: 'password', icon: Key, label: 'Changer le mot de passe' },
    { key: 'linked-accounts', icon: Plus, label: 'Comptes liés' },
    { key: 'delete-account', icon: Trash2, label: 'Supprimer le compte' },
    { key: 'login-history', icon: Lock, label: translation.tabLabels.loginHistory },
    { key: 'saved-devices', icon: Smartphone, label: translation.tabLabels.savedDevices },
  ];

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'mg', name: 'Malagasy', flag: '🇲🇬' },
    { code: 'ch', name: '中文', flag: '🇨🇳' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrivacyChange = (field: string, value: any) => {
    setPrivacySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: any) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setSaveSuccess(false);

      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        await updateSession({
          ...session,
          user: {
            ...session?.user,
            ...updatedUser,
          },
        });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Erreur lors de la sauvegarde');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (newAvatar: string | null) => {
    // Avatar is already updated via session in AvatarUpload component
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCoverChange = (newCover: string | null) => {
    // Cover is already updated via session in CoverImageUpload component
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleChangePassword = async () => {
    try {
      setPasswordChangeLoading(true);

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
      }

      const response = await fetch('/api/settings/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
          confirmPassword: passwordData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Mot de passe changé avec succès');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert(data.error || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      alert('Erreur lors du changement de mot de passe');
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteAccountLoading(true);

      if (!deleteConfirm.confirmDelete) {
        alert('Veuillez confirmer la suppression');
        return;
      }

      const response = await fetch('/api/settings/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: deleteConfirm.password,
          confirmDelete: deleteConfirm.confirmDelete,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Compte supprimé. Redirection...');
        await signOut({ redirect: true, callbackUrl: '/' });
      } else {
        alert(data.error || 'Erreur lors de la suppression du compte');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Erreur lors de la suppression du compte');
    } finally {
      setDeleteAccountLoading(false);
    }
  };

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
            {translation.settingsPage.managePreferences}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex flex-col lg:flex-row">
            {/* Sidebar - desktop only */}
            <aside className="hidden lg:block w-64 border-r border-gray-200">
              <nav className="p-4 space-y-6">
                {/* General Settings Section */}
                <div>
                  <button
                    onClick={() => setActiveSection('general')}
                    className={`w-full text-left text-sm font-semibold mb-2 px-3 py-2 rounded transition-colors ${
                      activeSection === 'general'
                        ? 'text-primary'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Paramètres généraux
                  </button>
                  <div className="space-y-1">
                    {activeSection === 'general' && generalTabs.map((tab) => {
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
                  </div>
                </div>

                {/* Account Settings Section */}
                <div>
                  <button
                    onClick={() => setActiveSection('account')}
                    className={`w-full text-left text-sm font-semibold mb-2 px-3 py-2 rounded transition-colors ${
                      activeSection === 'account'
                        ? 'text-primary'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Gestion de compte
                  </button>
                  <div className="space-y-1">
                    {activeSection === 'account' && accountTabs.map((tab) => {
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
                  </div>
                </div>
              </nav>
            </aside>

            {/* Mobile controls: show compact selectors for section/tab */}
            <div className="lg:hidden p-4 border-b border-gray-100">
              <div className="flex flex-col sm:flex-row gap-2">
                <select value={activeSection} onChange={(e) => setActiveSection(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg">
                  <option value="general">Paramètres</option>
                  <option value="account">Compte</option>
                </select>
                <select value={activeTab} onChange={(e) => setActiveTab(e.target.value as any)} className="w-full px-3 py-2 border rounded-lg">
                  {(activeSection === 'general' ? generalTabs : accountTabs).map(t => (
                    <option key={t.key} value={t.key as string}>{t.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 p-4 lg:p-6 min-w-0">
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
                  <div className="bg-gray-50 rounded-lg p-6 w-full">
                    <h3 className="text-md font-medium text-gray-900 mb-4">
                      {translation.settingsPage.profilePhoto}
                    </h3>
                    <div className="flex justify-center sm:justify-start">
                      <div className="w-full sm:w-auto max-w-xs">
                        <AvatarUpload
                          currentAvatar={session?.user?.avatar}
                          onAvatarChange={handleAvatarChange}
                          size="lg"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cover Image Section */}
                  <div className="bg-gray-50 rounded-lg p-6 w-full overflow-hidden">
                    <h3 className="text-md font-medium text-gray-900 mb-4">
                      {translation.settingsPage.coverPhoto}
                    </h3>
                    <CoverImageUpload
                      currentCover={(session?.user as any)?.coverImage}
                      onCoverChange={handleCoverChange}
                    />
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
                        Nom complet
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        rows={3}
                        value={formData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date de naissance
                      </label>
                      <input
                        type="date"
                        value={formData.dateOfBirth ?? ''}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ville d'origine
                      </label>
                      <input
                        type="text"
                        value={formData.originCity ?? ''}
                        onChange={(e) => handleInputChange('originCity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Ville actuelle
                      </label>
                      <input
                        type="text"
                        value={formData.currentCity ?? ''}
                        onChange={(e) => handleInputChange('currentCity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 flex items-center gap-3">
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        'Enregistrer les modifications'
                      )}
                    </button>
                    {saveSuccess && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-2 text-green-600"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm">Modifications enregistrées</span>
                      </motion.div>
                    )}
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
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={privacySettings.allowMessages === 'friends'}
                          onChange={(e) => handlePrivacyChange('allowMessages', e.target.checked ? 'friends' : 'everyone')}
                        />
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
                      <select
                        value={privacySettings.allowMessages}
                        onChange={(e) => handlePrivacyChange('allowMessages', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="everyone">Tous les utilisateurs</option>
                        <option value="friends">Amis uniquement</option>
                        <option value="none">Personne</option>
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
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={privacySettings.showOnlineStatus}
                          onChange={(e) => handlePrivacyChange('showOnlineStatus', e.target.checked)}
                        />
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
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notificationSettings.pushNotifications}
                          onChange={(e) => handleNotificationChange('pushNotifications', e.target.checked)}
                        />
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
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notificationSettings.likes}
                          onChange={(e) => handleNotificationChange('likes', e.target.checked)}
                        />
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
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notificationSettings.comments}
                          onChange={(e) => handleNotificationChange('comments', e.target.checked)}
                        />
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
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={notificationSettings.followers}
                          onChange={(e) => handleNotificationChange('followers', e.target.checked)}
                        />
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
                        Mode d'affichage
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setTheme('light')}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            theme === 'light'
                              ? 'border-primary bg-blue-50'
                              : 'border-gray-200 hover:border-primary'
                          }`}
                        >
                          <div className="w-full h-16 bg-white border border-gray-200 rounded mb-2"></div>
                          <span className="text-sm font-medium">Clair</span>
                        </button>
                        <button
                          onClick={() => setTheme('dark')}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            theme === 'dark'
                              ? 'border-primary bg-blue-50'
                              : 'border-gray-200 hover:border-primary'
                          }`}
                        >
                          <div className="w-full h-16 bg-gray-900 rounded mb-2"></div>
                          <span className="text-sm font-medium">Sombre</span>
                        </button>
                        <button
                          onClick={() => setTheme('auto')}
                          className={`p-4 border-2 rounded-lg transition-all ${
                            theme === 'auto'
                              ? 'border-primary bg-blue-50'
                              : 'border-gray-200 hover:border-primary'
                          }`}
                        >
                          <div className="w-full h-16 bg-gradient-to-r from-white to-gray-900 rounded mb-2"></div>
                          <span className="text-sm font-medium">Auto</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Change Password Tab */}
              {activeTab === 'password' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900">
                    Changer le mot de passe
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mot de passe actuel
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmer le mot de passe
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <button
                      onClick={handleChangePassword}
                      disabled={passwordChangeLoading}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {passwordChangeLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Changement en cours...
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          Changer le mot de passe
                        </>
                      )}
                    </button>
                    {saveSuccess && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-2 text-green-600"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm">Mot de passe changé avec succès</span>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* Linked Accounts Tab */}
              {activeTab === 'linked-accounts' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-lg font-semibold text-gray-900">
                    Comptes liés
                  </h2>

                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Liez d'autres comptes de réseaux sociaux à votre profil Unify.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        💡 Vous pouvez ajouter Google, Facebook ou d'autres comptes pour faciliter la connexion.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Delete Account Tab */}
              {activeTab === 'delete-account' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-6"
                >
                  <h2 className="text-lg font-semibold text-red-600">
                    Supprimer le compte
                  </h2>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">
                      ⚠️ La suppression de votre compte est permanente. Toutes vos données seront effacées et ne pourront pas être récupérées.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mot de passe
                      </label>
                      <input
                        type="password"
                        value={deleteConfirm.password}
                        onChange={(e) => setDeleteConfirm({ ...deleteConfirm, password: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="confirmDelete"
                        checked={deleteConfirm.confirmDelete}
                        onChange={(e) => setDeleteConfirm({ ...deleteConfirm, confirmDelete: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <label htmlFor="confirmDelete" className="text-sm text-gray-700">
                        Je comprends que ma suppression est définitive
                      </label>
                    </div>

                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteAccountLoading || !deleteConfirm.confirmDelete || !deleteConfirm.password}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {deleteAccountLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Suppression en cours...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Supprimer mon compte
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Login History Tab */}
              {activeTab === 'login-history' && (
                <motion.div
                  key="login-history"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="p-6"
                >
                  {session?.user?.id && (
                    <LoginHistoryView userId={session.user.id} />
                  )}
                </motion.div>
              )}

              {/* Saved Devices Tab */}
              {activeTab === 'saved-devices' && (
                <motion.div
                  key="saved-devices"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="p-6"
                >
                  {session?.user?.id && (
                    <SavedDevicesView userId={session.user.id} />
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </MainLayout>
  );
}