'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

interface SuggestedGroup {
  id: string;
  name: string;
  description: string;
  avatar: string;
  coverImage: string;
  members?: number;
  _count?: { members: number };
  category: string;
  privacy: 'public' | 'private';
}

interface GroupSuggestionsProps {
  compact?: boolean;
}

export function GroupSuggestions({ compact = false }: GroupSuggestionsProps) {
  const [groups, setGroups] = useState<SuggestedGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroups();
    
    // Synchronisation automatique toutes les 30 secondes
    const interval = setInterval(fetchGroups, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/groups?type=discover');
      if (!res.ok) throw new Error('Failed to fetch groups');
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (groupId: string) => {
    try {
      // Mock join action
      console.log('Joined group:', groupId);
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Groupes suggérés</h3>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    // No groups -> do not render
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Groupes suggérés</h3>
      <div className="space-y-4">
        {groups.slice(0, compact ? 3 : 5).map((group) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {group.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-gray-900 truncate">{group.name}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    group.privacy === 'public'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {group.privacy === 'public' ? 'Public' : 'Privé'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{group.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{((group.members ?? group._count?.members) ?? 0).toLocaleString()} membres</span>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 rounded-full">{group.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleJoin(group.id)}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Rejoindre</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Contacter</span>
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}