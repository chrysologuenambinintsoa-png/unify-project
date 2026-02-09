'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, AlertCircle, Lock, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageMembers } from '@/components/PageMembers';
import { ProfileImageUpload } from '@/components/ProfileImageUpload';
import { PollForm } from '@/components/PollForm';

interface PageManagementPanelProps {
  pageId: string;
  pageData: {
    name: string;
    description?: string;
    visibility: string;
    profileImage?: string;
  };
  isAdmin: boolean;
  onPageUpdated?: () => void;
}

export function PageManagementPanel({
  pageId,
  pageData,
  isAdmin,
  onPageUpdated,
}: PageManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'settings' | 'polls'>('members');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: pageData.name,
    description: pageData.description || '',
    visibility: pageData.visibility,
  });
  const router = useRouter();

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update page');
      }

      setSuccess('Page settings updated successfully');
      onPageUpdated?.();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating page');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async () => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;

    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/pages/${pageId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete page');
      }

      setSuccess('Page deleted successfully. Redirecting...');
      setTimeout(() => {
        router.push('/pages');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting page');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-300">Admin Access Required</p>
          <p className="text-sm text-amber-200/70">Only page administrators can manage this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="w-6 h-6 text-amber-500" />
        <h2 className="text-2xl font-bold">Page Management</h2>
      </div>

      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-300 p-4 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-500/20 border border-green-500/50 text-green-300 p-4 rounded-lg">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-700">
        {(['members', 'settings', 'polls'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition border-b-2 ${
              activeTab === tab
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'members' && <PageMembers pageId={pageId} isAdmin={isAdmin} />}

      {activeTab === 'settings' && (
        <div className="space-y-6 bg-gray-800/20 p-6 rounded-lg border border-amber-500/20">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Page Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-gray-700/50 border border-amber-500/30 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-amber-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-gray-700/50 border border-amber-500/30 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-amber-500 resize-none h-24"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Visibility</label>
            <select
              value={formData.visibility}
              onChange={(e) => setFormData({ ...formData, visibility: e.target.value })}
              className="w-full bg-gray-700/50 border border-amber-500/30 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-amber-500"
              disabled={loading}
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>

          <ProfileImageUpload
            pageId={pageId}
            currentImage={pageData.profileImage}
            onImageUploaded={() => onPageUpdated?.()}
          />

          <div className="flex gap-2">
            <Button
              variant="primary"
              onClick={handleSaveSettings}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>

            <Button
              variant="ghost"
              onClick={handleDeletePage}
              disabled={loading}
              className="text-red-400 hover:text-red-300"
            >
              Delete Page
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'polls' && <PollForm pageId={pageId} onPollCreated={() => {}} />}
    </div>
  );
}
