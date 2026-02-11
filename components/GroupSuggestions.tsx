 'use client';

import React from 'react';
import { useGroupSuggestions } from '@/hooks/useGroupSuggestions';
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { items: groups, loading, error, refresh } = useGroupSuggestions();
  const [joinedIds, setJoinedIds] = React.useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!groups || groups.length === 0) return;
    const initial = new Set<string>();
    groups.forEach((g: any) => {
      if (g.isMember) initial.add(g.id);
    });
    setJoinedIds(initial);
  }, [groups]);

  const handleJoin = async (groupId: string) => {
    try {
      setActionLoading(prev => new Set(prev).add(groupId));
      
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.action === 'joined') {
          setJoinedIds(prev => new Set(prev).add(groupId));
        } else {
          setJoinedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(groupId);
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error('Error joining group:', error);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(groupId);
        return newSet;
      });
    }
  };

  const handleContact = async (groupId: string) => {
    try {
      // Navigate to messages or open contact modal
      // For now, just show a simple alert
      router.push(`/messages?group=${groupId}`);
    } catch (error) {
      console.error('Error contacting group:', error);
    }
  };

  if (loading || error) return null;
  if (!groups || groups.length === 0) return null;

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg border border-yellow-100 dark:border-yellow-800/30">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Groupes suggérés</h3>
      <div className="space-y-3 md:space-y-4">
        {groups.slice(0, compact ? 3 : 5).map((group: any) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-gray-200 dark:border-gray-700 rounded-lg md:rounded-xl p-2 sm:p-3 md:p-4 hover:shadow-md dark:hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start gap-2 sm:gap-3 md:gap-4 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-lg flex-shrink-0">
                {group.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 md:gap-2 mb-1 flex-wrap">
                  <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm md:text-base">{group.name}</h4>
                  <span className={`px-1.5 md:px-2 py-0.5 md:py-1 text-xs rounded-full flex-shrink-0 ${
                    group.privacy === 'public'
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {group.privacy === 'public' ? 'Public' : 'Privé'}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{group.description}</p>
                <div className="flex items-center gap-2 md:gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2 md:mb-3 flex-wrap">
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <Users className="w-3 h-3 flex-shrink-0" />
                    <span>{((group.members ?? group._count?.members) ?? 0).toLocaleString()}</span>
                  </div>
                  <span className="px-1.5 md:px-2 py-0.5 md:py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs whitespace-nowrap">{group.category}</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                  <Button
                    onClick={() => handleJoin(group.id)}
                    variant={joinedIds.has(group.id) ? 'secondary' : 'primary'}
                    size="sm"
                    className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 whitespace-nowrap"
                    disabled={actionLoading.has(group.id)}
                  >
                    <UserPlus className="w-3 h-3 flex-shrink-0" />
                    <span className="hidden sm:inline">{joinedIds.has(group.id) ? 'Rejoint' : 'Rejoindre'}</span>
                    <span className="sm:hidden">{joinedIds.has(group.id) ? '✓' : '+'}</span>
                  </Button>
                  <Button
                    onClick={() => handleContact(group.id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 whitespace-nowrap"
                    disabled={actionLoading.has(group.id)}
                  >
                    <MessageCircle className="w-3 h-3 flex-shrink-0" />
                    <span className="hidden sm:inline">Contacter</span>
                    <span className="sm:hidden">💬</span>
                  </Button>
                  <Button
                    onClick={() => router.push(`/groups/${group.id}`)}
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2 whitespace-nowrap"
                  >
                    <span className="hidden sm:inline">Explorer</span>
                    <span className="sm:hidden">🔍</span>
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