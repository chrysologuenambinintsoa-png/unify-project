'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Search, TrendingUp, Users, Hash } from 'lucide-react';

interface TrendingPost {
  id: string;
  content: string;
  user: {
    username: string;
    fullName: string;
    avatar: string;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

interface SuggestedUser {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  bio: string;
  _count: {
    followers: number;
  };
}

export default function ExplorePage() {
  const { translation } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'people' | 'topics'>('trending');
  const [trendingPosts, setTrendingPosts] = useState<TrendingPost[]>([]);
  const [suggestedUsers, setSuggestedUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExploreData();
  }, []);

  const fetchExploreData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/explore');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des données d\'exploration');
      }
      const data = await response.json();
      setTrendingPosts(data.trendingPosts);
      setSuggestedUsers(data.suggestedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const trendingPostsMock = [
    {
      id: '1',
      content: '🚀 Nouvelle fonctionnalité incroyable sur Unify !',
      author: 'Unify Team',
      likes: 1247,
      comments: 89,
      shares: 23,
    },
    {
      id: '2',
      content: 'Le futur du développement web avec Next.js 15',
      author: 'Tech Guru',
      likes: 892,
      comments: 156,
      shares: 45,
    },
  ];

  const suggestedPeople = [
    {
      id: '1',
      name: 'Alice Johnson',
      username: 'alice_dev',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=alice',
      bio: 'Full-stack developer | React enthusiast',
      followers: 1234,
    },
    {
      id: '2',
      name: 'Bob Smith',
      username: 'bob_design',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=bob',
      bio: 'UI/UX Designer | Creative mind',
      followers: 987,
    },
  ];

  const trendingTopics = [
    { name: '#Unify', posts: 15420 },
    { name: '#NextJS', posts: 8920 },
    { name: '#React', posts: 12450 },
    { name: '#TypeScript', posts: 6780 },
  ];

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {translation.nav.explore}
          </h1>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={translation.common.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'trending', icon: TrendingUp, label: 'Tendances' },
              { key: 'people', icon: Users, label: 'Personnes' },
              { key: 'topics', icon: Hash, label: 'Sujets' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          {activeTab === 'trending' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Publications populaires</h2>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-500">Chargement des publications...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : trendingPosts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Aucune publication populaire pour le moment.</p>
                </div>
              ) : (
                trendingPosts.map((post) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200"
                  >
                    <p className="text-gray-900 mb-2">{post.content}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Par {post.user.fullName || post.user.username}</span>
                      <div className="flex space-x-4">
                        <span>{post._count.likes} likes</span>
                        <span>{post._count.comments} commentaires</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'people' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personnes suggérées</h2>
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-500">Chargement des suggestions...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500">{error}</p>
                </div>
              ) : suggestedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Aucune suggestion pour le moment.</p>
                </div>
              ) : (
                suggestedUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt={user.fullName || user.username}
                        className="w-12 h-12 rounded-full"
                      />
                      <div>
                        <h3 className="font-medium text-gray-900">{user.fullName || user.username}</h3>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                        {user.bio && <p className="text-sm text-gray-600">{user.bio}</p>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">{user._count.followers} abonnés</p>
                      <button className="mt-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-light transition-colors">
                        Suivre
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sujets tendance</h2>
              {trendingTopics.map((topic, index) => (
                <motion.div
                  key={topic.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center justify-between"
                >
                  <div>
                    <h3 className="font-medium text-gray-900">{topic.name}</h3>
                    <p className="text-sm text-gray-500">{topic.posts.toLocaleString()} publications</p>
                  </div>
                  <button className="px-4 py-2 text-primary border border-primary rounded-lg text-sm font-medium hover:bg-primary hover:text-white transition-colors">
                    Voir plus
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </MainLayout>
  );
}