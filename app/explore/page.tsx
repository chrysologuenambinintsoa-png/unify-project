'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
import { Search, TrendingUp, Users, Hash, Heart, MessageCircle, Loader } from 'lucide-react';
import { Button } from '@/components/ui/Button';

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
  const [trendingTopics, setTrendingTopics] = useState<Array<{ name: string; posts: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [trendingLoaded, setTrendingLoaded] = useState(false);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [topicsLoaded, setTopicsLoaded] = useState(false);
  const [activeTabLoading, setActiveTabLoading] = useState(false);

  useEffect(() => {
    fetchExploreData();
  }, []);

  useEffect(() => {
    // Load specific tab data when user switches tabs
    if (activeTab === 'trending' && !trendingLoaded) {
      loadTrendingData();
    } else if (activeTab === 'people' && !usersLoaded) {
      loadUsersData();
    } else if (activeTab === 'topics' && !topicsLoaded) {
      loadTopicsData();
    }
  }, [activeTab, trendingLoaded, usersLoaded, topicsLoaded]);

  const loadTrendingData = async () => {
    try {
      setActiveTabLoading(true);
      const response = await fetchWithTimeout('/api/explore', undefined, 10000);
      if (response.ok) {
        const data = await response.json();
        setTrendingPosts(data.trendingPosts || []);
        setTrendingLoaded(true);
      }
    } catch (err) {
      console.error('Error loading trending:', err);
    } finally {
      setActiveTabLoading(false);
    }
  };

  const loadUsersData = async () => {
    try {
      setActiveTabLoading(true);
      const response = await fetchWithTimeout('/api/explore', undefined, 10000);
      if (response.ok) {
        const data = await response.json();
        setSuggestedUsers(data.suggestedUsers || []);
        setUsersLoaded(true);
      }
    } catch (err) {
      console.error('Error loading users:', err);
    } finally {
      setActiveTabLoading(false);
    }
  };

  const loadTopicsData = async () => {
    try {
      setActiveTabLoading(true);
      const response = await fetchWithTimeout('/api/explore/trends', undefined, 10000);
      if (response.ok) {
        const data = await response.json();
        setTrendingTopics(Array.isArray(data) ? data : []);
        setTopicsLoaded(true);
      }
    } catch (err) {
      console.error('Error loading topics:', err);
    } finally {
      setActiveTabLoading(false);
    }
  };

  const fetchExploreData = async () => {
    try {
      setLoading(true);
      const [exploreRes, trendsRes] = await Promise.all([
        fetchWithTimeout('/api/explore', undefined, 10000),
        fetchWithTimeout('/api/explore/trends', undefined, 10000),
      ]);
      
      if (exploreRes.ok) {
        const data = await exploreRes.json();
        setTrendingPosts(data.trendingPosts || []);
        setSuggestedUsers(data.suggestedUsers || []);
        setTrendingLoaded(true);
        setUsersLoaded(true);
      }
      
      if (trendsRes.ok) {
        const trendsData = await trendsRes.json();
        setTrendingTopics(Array.isArray(trendsData) ? trendsData : []);
        setTopicsLoaded(true);
      }
    } catch (err) {
      if ((err as any)?.name === 'AbortError') {
        setError('Le chargement a expiré. Vérifiez votre connexion et réessayez.');
      } else {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUser = async (userId: string) => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: userId }),
      });

      if (response.ok) {
        setFollowingIds(new Set([...followingIds, userId]));
      }
    } catch (err) {
      console.error('Error following user:', err);
    }
  };

  return (
    <MainLayout>
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {translation.nav.explore}
          </h1>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={translation.common.search || 'Rechercher...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-dark focus:border-transparent bg-white"
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
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg text-sm font-semibold transition-all ${
                  activeTab === tab.key
                    ? 'bg-primary-dark text-white shadow-lg'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-5 h-5" />
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
                  <Loader size={32} className="animate-spin text-primary-dark mx-auto mb-3" />
                  <p className="text-gray-500">Chargement des publications...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500 font-semibold">{error}</p>
                  <Button variant="outline" onClick={fetchExploreData} className="mt-4">
                    Réessayer
                  </Button>
                </div>
              ) : trendingPosts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Aucune publication populaire pour le moment.</p>
                </div>
              ) : (
                trendingPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md"
                  >
                    <div className="flex items-start space-x-4 mb-4">
                      <img
                        src={post.user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt={post.user.fullName || post.user.username}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{post.user.fullName || post.user.username}</h3>
                        <p className="text-sm text-gray-500">@{post.user.username}</p>
                      </div>
                    </div>
                    <p className="text-gray-900 mb-4 line-clamp-3">{post.content}</p>
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t border-gray-100">
                      <div className="flex space-x-6">
                        <span className="flex items-center space-x-1 hover:text-red-500 cursor-pointer transition">
                          <Heart size={16} />
                          <span>{post._count.likes}</span>
                        </span>
                        <span className="flex items-center space-x-1 hover:text-blue-500 cursor-pointer transition">
                          <MessageCircle size={16} />
                          <span>{post._count.comments}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'people' && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personnes suggérées</h2>
              {loading ? (
                <div className="text-center py-12">
                  <Loader size={32} className="animate-spin text-primary-dark mx-auto mb-3" />
                  <p className="text-gray-500">Chargement des suggestions...</p>
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-red-500 font-semibold">{error}</p>
                  <Button variant="outline" onClick={fetchExploreData} className="mt-4">
                    Réessayer
                  </Button>
                </div>
              ) : suggestedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Aucune suggestion pour le moment.</p>
                </div>
              ) : (
                suggestedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <img
                        src={user.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default'}
                        alt={user.fullName || user.username}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.fullName || user.username}</h3>
                        <p className="text-sm text-gray-500">@{user.username}</p>
                        {user.bio && <p className="text-sm text-gray-600 line-clamp-1">{user.bio}</p>}
                        <p className="text-xs text-gray-400 mt-1">{user._count.followers} amis</p>
                      </div>
                    </div>
                    <Button
                      variant={followingIds.has(user.id) ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => handleFollowUser(user.id)}
                      disabled={followingIds.has(user.id)}
                    >
                      {followingIds.has(user.id) ? 'Demande envoyée' : 'Ajouter'}
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'topics' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Sujets tendance</h2>
              <p className="text-sm text-gray-500 mb-6">Découvrez les conversations populaires</p>
              {loading ? (
                <div className="text-center py-12">
                  <Loader size={32} className="animate-spin text-primary-dark mx-auto mb-3" />
                  <p className="text-gray-500">Chargement des sujets...</p>
                </div>
              ) : trendingTopics.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Aucun sujet tendance pour le moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {trendingTopics.map((topic, index) => {
                    // Generate colors based on topic name hash for consistency
                    const colors = [
                      'from-blue-400 to-blue-600',
                      'from-red-400 to-red-600',
                      'from-cyan-400 to-blue-500',
                      'from-blue-500 to-blue-700',
                      'from-purple-400 to-purple-600',
                      'from-green-400 to-green-600',
                      'from-yellow-400 to-yellow-600',
                      'from-pink-400 to-pink-600',
                    ];
                    const color = colors[index % colors.length];
                    const icons = ['💬', '⚛️', '🔵', '📘', '🚀', '✨', '🎯', '💡'];
                    const icon = icons[index % icons.length];

                    return (
                      <div
                        key={topic.name}
                        className={`bg-gradient-to-br ${color} p-6 rounded-lg shadow-sm text-white cursor-pointer hover:shadow-lg`}
                      >
                        <div className="text-3xl mb-3">{icon}</div>
                        <h3 className="font-bold text-lg">{topic.name}</h3>
                        <p className="text-white/80 text-sm">{topic.posts} publications</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}