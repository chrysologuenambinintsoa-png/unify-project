'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { SettingsSkeleton } from '@/components/skeletons/SettingsSkeleton';
import { useTheme } from '@/contexts/ThemeContext';
import { motion } from 'framer-motion';
import { Settings, User, Bell, Shield, Palette, Globe, CheckCircle, Lock, Smartphone, LogOut, Key, Plus, Trash2 } from 'lucide-react';
import { AvatarUpload } from '@/components/AvatarUpload';
import { CoverImageUpload } from '@/components/CoverImageUpload';
import { useSession, signOut } from 'next-auth/react';
import LoginHistoryView from '@/components/LoginHistoryView';
import SavedDevicesView from '@/components/SavedDevicesView';

export default function SettingsPage() {
  const router = useRouter();
  const { isReady } = useRequireAuth();
  const { data: session, update: updateSession } = useSession();
  const { translation, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  
  const [activeSection, setActiveSection] = useState<'general' | 'account'>('general');
  const [activeTab, setActiveTab] = useState<'general' | 'privacy' | 'notifications' | 'appearance' | 'password' | 'linked-accounts' | 'delete-account' | 'login-history' | 'saved-devices'>('general');
  const [loading, setLoading] = useState(!isReady);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false);
  const [userLoaded, setUserLoaded] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    bio: '',
    coverImage: '',
    dateOfBirth: '',
    originCity: '',
    currentCity: '',
    gender: 'other',
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
        const response = await fetch('/api/users/profile', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          setFormData({
            fullName: data.fullName || '',
            bio: data.bio || '',
            coverImage: data.coverImage || '',
            dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth).toISOString().split('T')[0] : '',
            originCity: data.originCity || '',
            currentCity: data.currentCity || '',
            gender: data.gender || 'other',
          });
        }
        setUserLoaded(true);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setUserLoaded(true);
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
    { key: 'password', icon: Key, label: translation.buttons?.changePassword || 'Change password' },
    { key: 'linked-accounts', icon: Plus, label: translation.passwordSection?.linkedAccounts || 'Linked accounts' },
    { key: 'delete-account', icon: Trash2, label: translation.buttons?.deleteAccount || 'Delete account' },
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
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePrivacyChange = (field: string, value: any) => {
    setPrivacySettings(prev => {
      const next = { ...prev, [field]: value };
      // persist showOnlineStatus to localStorage so other components can read it
      try {
        if (field === 'showOnlineStatus') {
          if (typeof window !== 'undefined') localStorage.setItem('showOnlineStatus', JSON.stringify(!!value));
        }
      } catch (e) {}
      return next;
    });
  };

  // Initialize privacy settings from localStorage (showOnlineStatus)
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const v = localStorage.getItem('showOnlineStatus');
        if (v !== null) {
          setPrivacySettings(prev => ({ ...prev, showOnlineStatus: v === 'true' }));
        }
      }
    } catch (e) {}
  }, []);

  // Early return if auth not ready (after all hooks) - show skeleton standalone
  if (!isReady) {
    return <SettingsSkeleton />;
  }

  const handleNotificationChange = (field: string, value: any) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setSaveSuccess(false);

      // Build request body with only the fields we want to send
      const requestBody = {
        fullName: formData.fullName,
        bio: formData.bio,
        coverImage: formData.coverImage,
        dateOfBirth: formData.dateOfBirth || undefined,
        originCity: formData.originCity,
        currentCity: formData.currentCity,
        gender: formData.gender,
      };

      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        credentials: 'include',
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
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        alert('Erreur lors de la sauvegarde: ' + (errorData.error || 'Unknown error'));
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
        credentials: 'include',
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
        alert(translation.messages?.confirmDelete || 'Please confirm deletion');
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
        alert(translation.alerts?.accountDeletedRedirecting || 'Account deleted. Redirecting...');
        await signOut({ redirect: false });
        router.push('/auth/logout');
      } else {
        alert(data.error || translation.alerts?.errorDeletingAccount || 'Error deleting account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert(translation.alerts?.errorDeletingAccount || 'Error deleting account');
    } finally {
      setDeleteAccountLoading(false);
    }
  };

  if (!userLoaded) {
    return (
      <MainLayout>
        <SettingsSkeleton />
      </MainLayout>
    );
  }

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
                    {translation.sections?.generalSettings || 'General settings'}
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
                    {translation.sections?.accountManagement || 'Account management'}
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
                  <option value="general">{translation.sections?.generalSettings || 'Settings'}</option>
                  <option value="account">{translation.sections?.accountManagement || 'Account'}</option>
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
                        {translation.forms?.fullName || 'Full name'}
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
                        {translation.forms?.bio || 'Bio'}
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
                        {translation.forms?.dateOfBirth || 'Date of birth'}
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
                        {translation.forms?.originCity || 'City of origin'}
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
                        {translation.forms?.currentCity || 'Current city'}
                      </label>
                      <input
                        type="text"
                        value={formData.currentCity ?? ''}
                        onChange={(e) => handleInputChange('currentCity', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {typeof translation.forms?.gender === 'string'
                          ? translation.forms?.gender
                          : 'Gender'
                        }
                      </label>
                      <select
                        value={formData.gender || 'other'}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="male">{translation.forms?.gender?.male || 'Male'}</option>
                        <option value="female">{translation.forms?.gender?.female || 'Female'}</option>
                        <option value="other">{translation.forms?.gender?.other || 'Other'}</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200 flex items-center gap-3">
                    <button
                      onClick={handleSaveProfile}
                      disabled={loading}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {translation.buttons?.saveChanges || 'Save changes'}
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
                          {translation.privacyLabels?.privateProfile || 'Private profile'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {translation.privacyLabels?.privateProfileDesc || 'Only people you approve can see your posts'}
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
                          {translation.privacyLabels?.privateMessages || 'Private messages'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {translation.privacyLabels?.privateMessagesDesc || 'Control who can send you messages'}
                        </p>
                      </div>
                      <select
                        value={privacySettings.allowMessages}
                        onChange={(e) => handlePrivacyChange('allowMessages', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="everyone">{translation.settingsForm?.allUsers || 'All users'}</option>
                        <option value="friends">{translation.settingsForm?.friendsOnly || 'Friends only'}</option>
                        <option value="none">{translation.settingsForm?.nobody || 'Nobody'}</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-gray-900">
                          {translation.privacyLabels?.onlineActivity || 'Online activity'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {translation.privacyLabels?.onlineActivityDesc || 'Show when you are online'}
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
                          {translation.notificationLabels?.pushNotifications || 'Push notifications'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {translation.notificationLabels?.pushNotificationsDesc || 'Receive notifications on your device'}
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
                          {translation.notificationLabels?.likes || 'Likes and reactions'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {translation.notificationLabels?.likesDesc || 'When someone likes or reacts to your posts'}
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
                          {translation.notificationLabels?.comments || 'Comments'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {translation.notificationLabels?.commentsDesc || 'When someone comments on your posts'}
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
                          {translation.notificationLabels?.followers || 'New followers'}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {translation.notificationLabels?.followersDesc || 'When someone starts following you'}
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
                        {translation.theme?.displayMode || 'Display mode'}
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
                          <span className="text-sm font-medium">{translation.theme?.light || 'Light'}</span>
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
                          <span className="text-sm font-medium">{translation.theme?.dark || 'Dark'}</span>
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
                          <span className="text-sm font-medium">{translation.theme?.auto || 'Auto'}</span>
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
                    {translation.passwordSection?.changePassword || 'Change password'}
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {translation.passwordSection?.currentPassword || 'Current password'}
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
                        {translation.passwordSection?.newPassword || 'New password'}
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
                        {translation.passwordSection?.confirmPassword || 'Confirm password'}
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
                      <Key className="w-4 h-4" />
                      {translation.passwordSection?.changePassword || 'Change password'}
                    </button>
                    {saveSuccess && (
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        className="flex items-center gap-2 text-green-600"
                      >
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm">{translation.passwordSection?.passwordChangedSuccess || 'Password changed successfully'}</span>
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
                    {translation.passwordSection?.linkedAccounts || 'Linked accounts'}
                  </h2>

                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      {translation.passwordSection?.linkAccountsDescription || 'Link other social media accounts to your Unify profile.'}
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-800">
                        {translation.passwordSection?.linkAccountsTip || '💡 You can add Google, Facebook or other accounts to make logging in easier.'}
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
                    {translation.passwordSection?.deleteAccount || 'Delete account'}
                  </h2>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">
                      {translation.passwordSection?.deleteAccountWarning || '⚠️ Deleting your account is permanent. All your data will be erased and cannot be recovered.'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {translation.passwordSection?.password || 'Password'}
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
                        {translation.passwordSection?.deleteAccountConfirmation || 'I understand that my deletion is permanent'}
                      </label>
                    </div>

                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteAccountLoading || !deleteConfirm.confirmDelete || !deleteConfirm.password}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {translation.passwordSection?.deleteAccount || 'Delete account'}
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