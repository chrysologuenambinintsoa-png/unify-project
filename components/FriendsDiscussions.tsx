'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Send } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface Discussion {
  id: string;
  userId: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar: string | null;
  };
  lastMessage: {
    content: string;
    createdAt: string;
    isRead: boolean;
  } | null;
  updatedAt: string;
  unreadCount: number;
}

interface FriendsDiscussionsProps {
  limit?: number;
}

export function FriendsDiscussions({ limit = 8 }: FriendsDiscussionsProps) {
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscussions();
  }, []);

  const fetchDiscussions = async () => {
    try {
      console.log('[FriendsDiscussions] Starting fetch from /api/messages');
      const response = await fetch('/api/messages');
      console.log('[FriendsDiscussions] Response status:', response.status, 'ok:', response.ok);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[FriendsDiscussions] Response data:', data);
        
        const conversations = data.conversations || [];
        console.log('[FriendsDiscussions] Conversations count:', conversations.length);
        
        const transformed = conversations.map((conv: any) => ({
          id: conv.id,
          userId: conv.id,
          user: conv.user,
          lastMessage: {
            content: conv.lastMessage || 'Message',
            createdAt: conv.time,
            isRead: false,
          },
          updatedAt: conv.time,
          unreadCount: conv.unread || 0,
        }));
        setDiscussions(transformed.slice(0, limit));
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to fetch discussions:', {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorData,
        });
        console.warn('[FriendsDiscussions] API Error Details:', JSON.stringify(errorData, null, 2));
        setDiscussions([]);
      }
    } catch (error) {
      console.error('Error fetching discussions:', error);
      console.error('[FriendsDiscussions] Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      setDiscussions([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading || discussions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-md p-4 md:p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-500" />
          Discussions
        </h3>
        <Link href="/messages" className="text-xs text-blue-500 hover:text-blue-600 dark:hover:text-blue-400">
          Voir tout →
        </Link>
      </div>

      {/* Horizontal scroll for discussions */}
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-hide">
        {discussions.map((discussion) => (
          <Link
            key={discussion.id}
            href={`/messages?user=${discussion.userId}`}
          >
            <motion.div
              whileHover={{ y: -4 }}
              className="flex-shrink-0 w-32 sm:w-36 cursor-pointer"
            >
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-3 hover:shadow-lg transition-all border border-gray-200 dark:border-gray-700">
                {/* Avatar */}
                <div className="relative mb-3 flex justify-center">
                  <div className="relative">
                    <Avatar
                      src={discussion.user.avatar}
                      name={discussion.user.fullName}
                      size="lg"
                      className="w-16 h-16"
                    />
                    {discussion.unreadCount > 0 && (
                      <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                        {discussion.unreadCount > 9 ? '9+' : discussion.unreadCount}
                      </div>
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {discussion.user.fullName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    @{discussion.user.username}
                  </p>
                </div>

                {/* Last Message Preview */}
                {discussion.lastMessage && (
                  <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
                      {discussion.lastMessage.content}
                    </p>
                  </div>
                )}

                {/* Message Button */}
                <button className="w-full mt-3 bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-1">
                  <Send className="w-3 h-3" />
                  Message
                </button>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}
