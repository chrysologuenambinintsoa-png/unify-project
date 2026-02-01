'use client';

import { useState, useEffect } from 'react';
import { X, MessageCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface Friend {
  id: string;
  username: string;
  fullName: string;
  avatar?: string;
}

interface Group {
  id: string;
  name: string;
  image?: string;
  memberCount?: number;
}

interface ShareModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
  onShare: (shareType: 'message' | 'group', id: string, message?: string) => Promise<void>;
  postContent?: string;
}

export default function ShareModal({
  postId,
  isOpen,
  onClose,
  onShare,
  postContent,
}: ShareModalProps) {
  const [shareMode, setShareMode] = useState<'message' | 'group'>('message');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [error, setError] = useState('');

  // Fetch friends
  useEffect(() => {
    if (isOpen && shareMode === 'message') {
      fetchFriends();
    }
  }, [isOpen, shareMode]);

  // Fetch groups
  useEffect(() => {
    if (isOpen && shareMode === 'group') {
      fetchGroups();
    }
  }, [isOpen, shareMode]);

  const fetchFriends = async () => {
    try {
      setLoadingFriends(true);
      setError('');
      const response = await fetch('/api/friends/list');
      if (!response.ok) throw new Error('Failed to load friends');
      const data = await response.json();
      // API returns { friends: [...] } structure
      setFriends(Array.isArray(data) ? data : data.friends || []);
      setSelectedId('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error loading friends';
      console.error('Error fetching friends:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoadingFriends(false);
    }
  };

  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      setError('');
      const response = await fetch('/api/groups?type=my');
      if (!response.ok) throw new Error('Failed to load groups');
      const data = await response.json();
      // Map groups to include memberCount
      const groupsData = Array.isArray(data) ? data : data.groups || [];
      const mappedGroups = groupsData.map((group: any) => ({
        id: group.id,
        name: group.name,
        image: group.image,
        memberCount: group.members?.length || 0,
      }));
      setGroups(mappedGroups);
      setSelectedId('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error loading groups';
      console.error('Error fetching groups:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleShare = async () => {
    if (!selectedId) {
      setError(`Please select a ${shareMode === 'message' ? 'friend' : 'group'}`);
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onShare(shareMode, selectedId, customMessage);
      onClose();
      setCustomMessage('');
      setSelectedId('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to share post';
      console.error('Share error:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Share Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            aria-label="Close"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Mode Selection */}
          <div className="p-6 border-b border-gray-200">
            <p className="text-sm font-semibold text-gray-600 mb-3">SHARE MODE</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShareMode('message')}
                className={cn(
                  'p-4 rounded-lg border-2 transition flex items-center space-x-3',
                  shareMode === 'message'
                    ? 'border-primary-dark bg-blue-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                )}
              >
                <MessageCircle
                  size={24}
                  className={shareMode === 'message' ? 'text-primary-dark' : 'text-gray-600'}
                />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Private Message</p>
                  <p className="text-xs text-gray-600">Send to a friend</p>
                </div>
              </button>

              <button
                onClick={() => setShareMode('group')}
                className={cn(
                  'p-4 rounded-lg border-2 transition flex items-center space-x-3',
                  shareMode === 'group'
                    ? 'border-accent-dark bg-yellow-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                )}
              >
                <Users
                  size={24}
                  className={shareMode === 'group' ? 'text-accent-dark' : 'text-gray-600'}
                />
                <div className="text-left">
                  <p className="font-semibold text-gray-900">Group Post</p>
                  <p className="text-xs text-gray-600">Share in a group</p>
                </div>
              </button>
            </div>
          </div>

          {/* Recipients List */}
          <div className="p-6">
            <p className="text-sm font-semibold text-gray-600 mb-3">
              {shareMode === 'message' ? 'SELECT FRIEND' : 'SELECT GROUP'}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {shareMode === 'message' ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadingFriends ? (
                  <div className="text-center py-8 text-gray-500">Loading friends...</div>
                ) : friends.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No friends yet</div>
                ) : (
                  friends.map((friend) => (
                    <button
                      key={friend.id}
                      onClick={() => setSelectedId(friend.id)}
                      className={cn(
                        'w-full p-3 rounded-lg border-2 transition text-left flex items-center space-x-3',
                        selectedId === friend.id
                          ? 'border-primary-dark bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      {friend.avatar ? (
                        <img
                          src={friend.avatar}
                          alt={friend.fullName || friend.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {(friend.fullName || friend.username || 'U').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{friend.fullName || friend.username}</p>
                        <p className="text-xs text-gray-500">@{friend.username}</p>
                      </div>
                      {selectedId === friend.id && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-primary-dark flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {loadingGroups ? (
                  <div className="text-center py-8 text-gray-500">Loading groups...</div>
                ) : groups.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No groups yet. Create one first!
                  </div>
                ) : (
                  groups.map((group) => (
                    <button
                      key={group.id}
                      onClick={() => setSelectedId(group.id)}
                      className={cn(
                        'w-full p-3 rounded-lg border-2 transition text-left flex items-center space-x-3',
                        selectedId === group.id
                          ? 'border-accent-dark bg-yellow-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      )}
                    >
                      {group.image ? (
                        <img
                          src={group.image}
                          alt={group.name || 'Group'}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-semibold">
                          {(group.name || 'G').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900">{group.name || 'Group'}</p>
                        {group.memberCount && (
                          <p className="text-xs text-gray-500">
                            {group.memberCount} members
                          </p>
                        )}
                      </div>
                      {selectedId === group.id && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-accent-dark flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Custom Message */}
          {selectedId && (
            <div className="p-6 border-t border-gray-200">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                ADD A MESSAGE (OPTIONAL)
              </label>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Add a comment when sharing..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
              {postContent && (
                <p className="mt-3 text-xs text-gray-500 bg-gray-50 p-3 rounded-lg line-clamp-2">
                  <span className="font-semibold">Post: </span>
                  {postContent}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            size="md"
            onClick={onClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant={shareMode === 'message' ? 'primary' : 'secondary'}
            size="md"
            onClick={handleShare}
            disabled={!selectedId || loading}
            className="flex-1"
          >
            {loading ? (
              <>
                <span className="inline-block animate-spin mr-2">⚙️</span>
                Sharing...
              </>
            ) : (
              'Share'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
