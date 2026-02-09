'use client';

import React, { useState, useEffect } from 'react';
import { Users, ExternalLink } from 'lucide-react';
import { HeartIcon } from '@/components/HeartIcon';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

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
  const [pages, setPages] = useState<SuggestedPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPages();
    
    // Synchronisation automatique toutes les 30 secondes
    const interval = setInterval(fetchPages, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchPages = async () => {
    try {
      setLoading(true);
      let res: Response | null = null;
      try {
        res = await fetch('/api/pages?type=discover');
      } catch (networkErr) {
        console.debug('Network error fetching pages:', networkErr);
        setPages([]);
        return;
      }

      if (!res || !res.ok) {
        let errBody: any = null;
        try { errBody = await res?.json(); } catch (_) { try { errBody = await res?.text(); } catch {} }
        console.debug('Failed to fetch pages', res?.status, errBody);
        setPages([]);
        return;
      }

      const data = await res.json();
      if (Array.isArray(data)) {
        setPages(data);
      } else if (Array.isArray((data as any).pages)) {
        setPages((data as any).pages);
      } else {
        setPages([]);
      }
    } catch (error) {
      console.debug('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (pageId: string) => {
    try {
      setActionLoading(prev => new Set(prev).add(pageId));
      
      const response = await fetch(`/api/pages/${pageId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.action === 'liked') {
          setLikedIds(prev => new Set(prev).add(pageId));
        } else {
          setLikedIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(pageId);
            return newSet;
          });
        }
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
        if (data.action === 'followed') {
          setFollowingIds(prev => new Set(prev).add(pageId));
        } else {
          setFollowingIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(pageId);
            return newSet;
          });
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
    // Don't show loading skeleton - just return null to avoid visual loading indicators
    return null;
  }

  if (pages.length === 0) {
    // No pages -> do not render
    return null;
  }

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg md:rounded-2xl p-3 sm:p-4 md:p-6 shadow-lg border border-yellow-100 dark:border-yellow-800/30">
      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4">Pages suggérées</h3>
      <div className="space-y-3 md:space-y-4">
        {pages.slice(0, compact ? 3 : 5).map((page) => (
          <motion.div
            key={page.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-gray-200 dark:border-gray-700 rounded-lg md:rounded-xl p-2 sm:p-3 md:p-4 hover:shadow-md dark:hover:shadow-xl transition-shadow"
          >
            <div className="flex items-start gap-2 sm:gap-3 md:gap-4 min-w-0">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-bold text-sm md:text-lg flex-shrink-0">
                {page.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate text-sm md:text-base">{page.name}</h4>
                <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">{page.description}</p>
                <div className="flex items-center gap-2 md:gap-4 text-xs text-gray-500 dark:text-gray-400 mb-2 md:mb-3 flex-wrap">
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <Users className="w-3 h-3 flex-shrink-0" />
                    <span>{(page.followers ?? 0).toLocaleString()}</span>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded-full text-xs whitespace-nowrap">{page.category || 'Catégorie'}</span>
                </div>
                <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                  <Button
                    onClick={() => handleLike(page.id)}
                    variant={likedIds.has(page.id) ? 'primary' : 'outline'}
                    size="sm"
                    className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2"
                    disabled={actionLoading.has(page.id)}
                  >
                    <HeartIcon 
                      className="w-3 h-3 flex-shrink-0" 
                      fill={likedIds.has(page.id)}
                    />
                    <span className="hidden sm:inline">J'aime</span>
                  </Button>
                  <Button
                    onClick={() => handleFollow(page.id)}
                    variant={followingIds.has(page.id) ? 'secondary' : 'primary'}
                    size="sm"
                    className="flex items-center gap-1 text-xs md:text-sm px-2 md:px-3 py-1 md:py-2"
                    disabled={actionLoading.has(page.id)}
                  >
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="hidden sm:inline">{followingIds.has(page.id) ? 'Suivi' : 'Suivre'}</span>
                    <span className="sm:hidden">{followingIds.has(page.id) ? '✓' : '+'}</span>
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