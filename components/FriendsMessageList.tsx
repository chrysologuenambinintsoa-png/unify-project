'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, User, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';

interface Friend {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  bio: string;
  friendshipId: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

interface FriendsMessageListProps {
  onSelectFriend?: (friendId: string) => void;
  selectedFriendId?: string | null;
  maxHeight?: string;
}

export function FriendsMessageList({
  onSelectFriend,
  selectedFriendId,
  maxHeight = 'max-h-96',
}: FriendsMessageListProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFriends();
  }, []);

  const fetchFriends = async (search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) {
        params.append('search', search);
      }
      params.append('limit', '50');

      const response = await fetch(`/api/messages/friends?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch friends');
      }
      const data = await response.json();
      setFriends(data.friends);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    fetchFriends(query);
  };

  const formatTime = (dateString: string | undefined) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const truncateMessage = (message: string | undefined) => {
    if (!message) return '';
    return message.length > 40 ? message.substring(0, 40) + '...' : message;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Rechercher un ami..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
      </div>

      {/* Friends List */}
      <div className={`flex-1 overflow-y-auto ${maxHeight}`}>
        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Chargement...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : friends.length === 0 ? (
          <div className="p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'Aucun ami trouvé' : 'Aucun ami'}
            </p>
          </div>
        ) : (
          friends.map((friend, index) => (
            <motion.div
              key={friend.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${
                selectedFriendId === friend.id
                  ? 'bg-primary/10 border-r-2 border-r-primary'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onSelectFriend?.(friend.id)}
              onMouseEnter={async () => {
                // Optimistically clear unread badge
                try {
                  // update local state
                  setFriends(prev => prev.map(f => f.id === friend.id ? { ...f, unreadCount: 0 } : f));
                  const url = typeof window !== 'undefined'
                    ? `${window.location.origin}/api/messages/mark-conversation-read`
                    : '/api/messages/mark-conversation-read';
                  await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: friend.id }),
                  });
                } catch (e) {
                  // ignore errors — UI already updated optimistically
                  console.error('Failed to mark conversation read', e);
                }
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="relative flex-shrink-0">
                  <Avatar src={friend.avatar || null} name={friend.fullName} size="md" className="w-10 h-10" />
                  {friend.unreadCount && friend.unreadCount > 0 && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                      {friend.unreadCount}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900 truncate text-sm">
                      {friend.fullName}
                    </h3>
                    {friend.lastMessageTime && (
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {formatTime(friend.lastMessageTime)}
                      </span>
                    )}
                  </div>
                  {friend.lastMessage ? (
                    <p className="text-xs text-gray-600 truncate">
                      {truncateMessage(friend.lastMessage)}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500 italic">
                      Aucun message
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {/* Start New Conversation Button */}
      {friends.length > 0 && (
        <div className="p-3 border-t border-gray-200">
          <Link
            href="/messages/new"
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-primary-dark text-white rounded-lg hover:bg-primary-light transition-colors text-sm font-medium"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Nouveau message</span>
          </Link>
        </div>
      )}
    </div>
  );
}

export default FriendsMessageList;
