'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

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

interface ToastMessage {
  id: string;
  type: 'success' | 'error';
  message: string;
  userId: string;
}

export function FriendSuggestions({ compact = false }: FriendSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestedFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessages, setToastMessages] = useState<ToastMessage[]>([]);
  const [requestingUserIds, setRequestingUserIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchSuggestions();
    
    // Auto-refresh disabled
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
      setSuggestions([]); // Fallback to empty suggestions
    } finally {
      setLoading(false);
    }
  };

  const addToast = (type: 'success' | 'error', message: string, userId: string) => {
    const id = `${userId}-${Date.now()}`;
    const toast: ToastMessage = { id, type, message, userId };
    setToastMessages(prev => [...prev, toast]);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      setToastMessages(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const handleAddFriend = async (userId: string, fullName: string) => {
    try {
      setRequestingUserIds(prev => new Set(prev).add(userId));
      
      const res = await fetch('/api/friends/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const error = await res.json();
        addToast('error', error.error || 'Erreur lors de l\'envoi de la demande', userId);
        setRequestingUserIds(prev => {
          const next = new Set(prev);
          next.delete(userId);
          return next;
        });
        return;
      }

      // Success - remove from suggestions and show toast
      setSuggestions(prev => prev.filter(s => s.id !== userId));
      addToast('success', `Demande d'ami envoyée à ${fullName}`, userId);
      setRequestingUserIds(prev => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      addToast('error', 'Une erreur est survenue', userId);
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
    // Don't show loading skeleton - just return null to avoid visual loading indicators
    return null;
  }

  if (suggestions.length === 0) {
    // No suggestions -> do not render the card
    return null;
  }

  return (
    <>
      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg border border-yellow-100 dark:border-yellow-800/30">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Suggestions d'amis</h3>
        <div className="space-y-3 md:space-y-4">
          {suggestions.slice(0, compact ? 3 : 5).map((suggestion) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex items-center justify-between p-2 sm:p-3 md:p-3 rounded-lg md:rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors gap-2 min-w-0"
            >
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
                <Avatar
                  src={suggestion.avatar}
                  name={suggestion.fullName}
                  size="md"
                  className="rounded-lg md:rounded-xl flex-shrink-0 w-10 h-10 md:w-12 md:h-12"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm md:text-base truncate">{suggestion.fullName}</p>
                  <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">
                    {(typeof suggestion.friendsCount === 'number'
                      ? suggestion.friendsCount
                      : (suggestion.mutualFriends ?? suggestion.mutualFriendsCount ?? 0))} amis
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={requestingUserIds.has(suggestion.id)}
                  onClick={() => handleAddFriend(suggestion.id, suggestion.fullName)}
                  className="p-1.5 md:p-2 bg-primary-dark hover:bg-primary-light dark:hover:bg-primary-light text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center"
                  title="Add friend"
                >
                  <UserPlus className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDismiss(suggestion.id)}
                  className="p-1.5 md:p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0 min-h-[32px] min-w-[32px] flex items-center justify-center"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Toast Messages */}
      <AnimatePresence>
        <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2">
          {toastMessages.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 20, x: 20 }}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg text-white ${
                toast.type === 'success' 
                  ? 'bg-green-500' 
                  : 'bg-red-500'
              }`}
            >
              {toast.type === 'success' ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span className="text-sm font-medium">{toast.message}</span>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </>
  );
}