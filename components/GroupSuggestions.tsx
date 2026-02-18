 'use client';

import React from 'react';
import { useGroupSuggestions } from '@/hooks/useGroupSuggestions';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { CardsSkeleton } from '@/components/skeletons/CardsSkeleton';

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
  const { translation } = useLanguage();
  const router = useRouter();
  const { data: session } = useSession();
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
        setJoinedIds(prev => {
          const newSet = new Set(prev);
          if (data.action === 'joined') newSet.add(groupId);
          else newSet.delete(groupId);
          return newSet;
        });
        // Refresh suggestions to remove joined group from the list
        if (data.action === 'joined') {
          await new Promise(resolve => setTimeout(resolve, 300));
          refresh();
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

  const handleContact = (groupId: string) => {
    try {
      router.push(`/messages?group=${groupId}`);
    } catch (error) {
      console.error('Error contacting group:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">{translation.group?.suggestedGroups || 'Suggested Groups'}</h3>
        <CardsSkeleton count={compact ? 3 : 5} cardWidth="w-40" />
      </div>
    );
  }

  if (error) return null;
  if (!groups || groups.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">{translation.group?.suggestedGroups || 'Suggested Groups'}</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        {groups.slice(0, compact ? 5 : 12).map((group: any) => (
          <motion.div
            key={group.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ y: -4 }}
            className="flex-shrink-0 w-40"
          >
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary-dark/20 dark:to-accent/20 rounded-xl p-3 hover:shadow-lg transition-all border border-primary/20 dark:border-primary-dark/30 h-full flex flex-col">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent dark:from-primary-dark dark:to-accent rounded-lg flex items-center justify-center text-white font-bold text-lg mb-2">
                {group.name.charAt(0)}
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm mb-1">{group.name}</h4>
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                  group.privacy === 'public'
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                }`}>
                  {group.privacy === 'public' ? translation.group?.public || 'Public' : translation.group?.private || 'Private'}
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 flex-grow">{group.description || translation.group?.noDescription || 'No description'}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3 pb-2 border-b border-primary/20 dark:border-primary-dark/30">
                <Users className="w-3 h-3" />
                <span>{((group.members ?? group._count?.members) ?? 0).toLocaleString()} {translation.group?.members || 'members'}</span>
              </div>
              <div className="flex gap-1 flex-col">
                <Button
                  onClick={() => handleJoin(group.id)}
                  variant={joinedIds.has(group.id) ? 'secondary' : 'primary'}
                  size="sm"
                  className="w-full text-xs py-2"
                  disabled={actionLoading.has(group.id)}
                >
                  {joinedIds.has(group.id) ? ('✓ ' + (translation.group?.joined || 'Joined')) : ('+ ' + (translation.group?.join || 'Join'))}
                </Button>
                <Button
                  onClick={() => handleContact(group.id)}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs py-2 flex items-center justify-center gap-1"
                  disabled={actionLoading.has(group.id)}
                >
                  <MessageCircle className="w-3 h-3" />
                  {translation.group?.contact || 'Contact'}
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}