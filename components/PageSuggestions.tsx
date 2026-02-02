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
      // Mock like action
      console.log('Liked page:', pageId);
    } catch (error) {
      console.error('Error liking page:', error);
    }
  };

  const handleFollow = async (pageId: string) => {
    try {
      // Mock follow action
      console.log('Followed page:', pageId);
    } catch (error) {
      console.error('Error following page:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pages suggérées</h3>
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

  if (pages.length === 0) {
    // No pages -> do not render
    return null;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Pages suggérées</h3>
      <div className="space-y-4">
        {pages.slice(0, compact ? 3 : 5).map((page) => (
          <motion.div
            key={page.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {page.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{page.name}</h4>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">{page.description}</p>
                <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>{(page.followers ?? 0).toLocaleString()} abonnés</span>
                  </div>
                  <span className="px-2 py-1 bg-gray-100 rounded-full">{page.category || 'Catégorie'}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    onClick={() => handleLike(page.id)}
                    variant="outline"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <HeartIcon className="w-3 h-3" fill={false} />
                    <span>J'aime</span>
                  </Button>
                  <Button
                    onClick={() => handleFollow(page.id)}
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>Suivre</span>
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