'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { usePageSuggestions } from '@/hooks/usePageSuggestions';
import { useLanguage } from '@/contexts/LanguageContext';
import { Users } from 'lucide-react';
import { HeartIcon } from '@/components/HeartIcon';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';
import { CardsSkeleton } from '@/components/skeletons/CardsSkeleton';

interface SuggestedPage {
  id: string;
  name: string;
  description: string;
  avatar: string;
  coverImage: string;
  followers: number;
  category: string;
}

interface PageSuggestionsProps {
  compact?: boolean;
}

export function PageSuggestions({ compact = false }: PageSuggestionsProps) {
  const { translation } = useLanguage();
  const { items: allPages, loading, error, refresh } = usePageSuggestions();
  const router = useRouter();
  const { data: session } = useSession();
  const [followingInitialized, setFollowingInitialized] = useState(false);
  const [likedInitialized, setLikedInitialized] = useState(false);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  // Filter out pages created by the current user
  const pages = React.useMemo(() => {
    if (!allPages || !session?.user?.id) return allPages || [];
    return (allPages || []).filter((p: any) => !p.isAdmin);
  }, [allPages, session?.user?.id]);

  React.useEffect(() => {
    if (!pages || pages.length === 0) return;
    const initial = new Set<string>();
    pages.forEach((p: any) => {
      if (p.isFollowing || p.isAdmin) initial.add(p.id);
    });
    setFollowingIds(initial);
    setFollowingInitialized(true);
  }, [pages]);

  React.useEffect(() => {
    if (!pages || pages.length === 0) return;
    const initialLikes = new Set<string>();
    pages.forEach((p: any) => {
      if (p.isLiked) initialLikes.add(p.id);
    });
    setLikedIds(initialLikes);
    setLikedInitialized(true);
  }, [pages]);

  const handleLike = async (pageId: string) => {
    try {
      setActionLoading(prev => new Set(prev).add(pageId));
      const response = await fetch(`/api/pages/${pageId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setLikedIds(prev => {
          const newSet = new Set(prev);
          if (data.action === 'liked') newSet.add(pageId);
          else newSet.delete(pageId);
          return newSet;
        });
      }
    } catch (error) {
      console.error('Error liking page:', error);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(pageId);
        return newSet;
      });
    }
  };

  const handleFollow = async (pageId: string) => {
    try {
      setActionLoading(prev => new Set(prev).add(pageId));
      const response = await fetch(`/api/pages/${pageId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        setFollowingIds(prev => {
          const newSet = new Set(prev);
          if (data.action === 'followed') newSet.add(pageId);
          else newSet.delete(pageId);
          return newSet;
        });
        // Refresh suggestions to remove followed page from the list
        if (data.action === 'followed') {
          await new Promise(resolve => setTimeout(resolve, 300));
          refresh();
        }
      }
    } catch (error) {
      console.error('Error following page:', error);
    } finally {
      setActionLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(pageId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">{translation.page?.suggestedPages || 'Suggested Pages'}</h3>
        <CardsSkeleton count={compact ? 3 : 5} cardWidth="w-40" />
      </div>
    );
  }

  if (pages.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-4">{translation.page?.suggestedPages || 'Suggested Pages'}</h3>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        {pages.slice(0, compact ? 5 : 12).map((page: any) => (
          <motion.div
            key={page.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ y: -4 }}
            className="flex-shrink-0 w-40"
          >
            <div className="bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary-dark/20 dark:to-accent/20 rounded-xl p-3 hover:shadow-lg transition-all border border-primary/20 dark:border-primary-dark/30 h-full flex flex-col">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent dark:from-primary-dark dark:to-accent rounded-lg flex items-center justify-center text-white font-bold text-lg mb-2">
                {page.name.charAt(0)}
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm mb-1">{page.name}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2 flex-grow">{page.description || translation.page?.noDescription || 'No description'}</p>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3 pb-2 border-b border-primary/20 dark:border-primary-dark/30">
                <Users className="w-3 h-3" />
                <span>{(page.followers ?? 0).toLocaleString()} {translation.page?.followers || 'followers'}</span>
              </div>
              <div className="flex gap-1 flex-col">
                <Button
                  onClick={() => handleFollow(page.id)}
                  variant={followingIds.has(page.id) ? 'secondary' : 'primary'}
                  size="sm"
                  className="w-full text-xs py-2"
                  disabled={actionLoading.has(page.id)}
                >
                  {followingIds.has(page.id) ? ('✓ ' + (translation.page?.following || 'Following')) : ('+ ' + (translation.page?.follow || 'Follow'))}
                </Button>
                <Button
                  onClick={() => handleLike(page.id)}
                  variant={likedIds.has(page.id) ? 'primary' : 'outline'}
                  size="sm"
                  className="w-full text-xs py-2 flex items-center justify-center gap-1"
                  disabled={actionLoading.has(page.id)}
                >
                  <HeartIcon className="w-3 h-3" fill={likedIds.has(page.id)} />
                  {likedIds.has(page.id) ? (translation.page?.liked || 'Liked') : (translation.page?.like || 'Like')}
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}