'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Settings, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { GroupMembers } from '@/components/GroupMembers';
import { ProfileImageUpload } from '@/components/ProfileImageUpload';
import { PollForm } from '@/components/PollForm';

interface GroupManagementPanelProps {
  groupId: string;
  groupData: {
    name: string;
    description?: string;
    visibility: string;
    profileImage?: string;
    isPrivate: boolean;
  };
  isAdmin: boolean;
  onGroupUpdated?: () => void;
}

export function GroupManagementPanel({
  groupId,
  groupData,
  isAdmin,
  onGroupUpdated,
}: GroupManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<'members' | 'settings' | 'polls'>('members');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: groupData.name,
    description: groupData.description || '',
    visibility: groupData.visibility,
    isPrivate: groupData.isPrivate,
  });
  const router = useRouter();

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update group');
      }

      setSuccess('Group settings updated successfully');
      onGroupUpdated?.();

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating group');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!confirm('Are you sure? This action cannot be undone.')) return;

    try {
      setLoading(true);
      setError('');

      const res = await fetch(`/api/groups/${groupId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete group');
      }

      setSuccess('Group deleted successfully. Redirecting...');
      setTimeout(() => {
        router.push('/groups');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting group');
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
          <p className="text-sm text-amber-200/70">Only group administrators can manage this group.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Settings className="w-6 h-6 text-amber-500" />
        <h2 className="text-2xl font-bold">Group Management</h2>
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
      {activeTab === 'members' && <GroupMembers groupId={groupId} isAdmin={isAdmin} />}

      {activeTab === 'settings' && (
        <div className="space-y-6 bg-gray-800/20 p-6 rounded-lg border border-amber-500/20">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Group Name</label>
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

          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Privacy</label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                  disabled={loading}
                />
                <span className="text-white">Private Group</span>
              </label>
            </div>
          </div>

          <ProfileImageUpload
            groupId={groupId}
            currentImage={groupData.profileImage}
            onImageUploaded={() => onGroupUpdated?.()}
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
              onClick={handleDeleteGroup}
              disabled={loading}
              className="text-red-400 hover:text-red-300"
            >
              Delete Group
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'polls' && <PollForm groupId={groupId} onPollCreated={() => {}} />}
    </div>
  );
}
