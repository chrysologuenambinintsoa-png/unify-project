'use client';

import React, { useState, useEffect } from 'react';
import { UserPlus, X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

interface SuggestedFriend {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  mutualFriends: number;
}

interface FriendSuggestionsProps {
  compact?: boolean;
}

export function FriendSuggestions({ compact = false }: FriendSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<SuggestedFriend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
    
    // Synchronisation automatique toutes les 30 secondes
    const interval = setInterval(fetchSuggestions, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      // TODO: Fetch from API
      setSuggestions([]);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFriend = async (userId: string) => {
    try {
      // Mock friend request
      setSuggestions(prev => prev.filter(s => s.id !== userId));
    } catch (error) {
      console.error('Error sending friend request:', error);
    }
  };

  const handleDismiss = (userId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== userId));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggestions d'amis</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggestions d'amis</h3>
        <p className="text-gray-500 text-center py-8">Aucune suggestion disponible</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggestions d'amis</h3>
      <div className="space-y-4">
        {suggestions.slice(0, compact ? 3 : 5).map((suggestion) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Avatar
                src={suggestion.avatar}
                name={suggestion.fullName}
                size="md"
                className="rounded-xl"
              />
              <div>
                <p className="font-medium text-gray-900">{suggestion.fullName}</p>
                <p className="text-sm text-gray-500">{suggestion.mutualFriends} amis en commun</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleAddFriend(suggestion.id)}
                className="p-2 bg-primary-dark text-white rounded-lg hover:bg-primary-light transition-colors"
              >
                <UserPlus className="w-4 h-4" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleDismiss(suggestion.id)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}