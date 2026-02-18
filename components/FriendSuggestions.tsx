'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { CardsSkeleton } from '@/components/skeletons/CardsSkeleton';

interface SuggestedFriend {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  mutualFriends?: number;
  mutualFriendsCount?: number;
  friendsCount?: number;
}

interface FriendSuggestionsProps {
  compact?: boolean;
}

export function FriendSuggestions({ compact = false }: FriendSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestedFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingUserIds, setRequestingUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/friends/suggestions', {
        method: 'GET',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!res.ok) {
        console.warn(`Friends suggestions API error: ${res.status}`);
        setSuggestions([]);
        return;
      }
      const data = await res.json();
      setSuggestions(data?.suggestions ?? []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (userId: string, fullName: string) => {
    try {
      setRequestingUserIds(prev => new Set(prev).add(userId));
      const res = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setSuggestions(prev => prev.filter(s => s.id !== userId));
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
    } finally {
      setRequestingUserIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    }
  };

  const handleDismiss = (userId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== userId));
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">Suggestions d'amis</h3>
        <CardsSkeleton count={compact ? 3 : 5} cardWidth="w-36" />
      </div>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">Suggestions d'amis</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        {suggestions.slice(0, compact ? 5 : 12).map((suggestion) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ y: -4 }}
            className="flex-shrink-0 w-36"
          >
            <div className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-900/20 dark:to-pink-900/40 rounded-xl p-3 hover:shadow-lg transition-all border border-pink-200 dark:border-pink-700/30 h-full flex flex-col items-center text-center">
              <Avatar
                src={suggestion.avatar}
                name={suggestion.fullName}
                className="w-12 h-12 rounded-lg mb-2 flex-shrink-0"
              />
              <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm w-full px-0.5">{suggestion.fullName}</h4>
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 pb-2 border-b border-pink-200 dark:border-pink-700/30 w-full">
                {(typeof suggestion.friendsCount === 'number'
                  ? suggestion.friendsCount
                  : (suggestion.mutualFriends ?? suggestion.mutualFriendsCount ?? 0))} amis
              </div>
              <div className="flex gap-1 flex-col w-full">
                <Button
                  onClick={() => handleAddFriend(suggestion.id, suggestion.fullName)}
                  variant="primary"
                  size="sm"
                  className="w-full text-xs py-2 flex items-center justify-center gap-1"
                  disabled={requestingUserIds.has(suggestion.id)}
                >
                  <UserPlus className="w-3 h-3" />
                  Ajouter
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}