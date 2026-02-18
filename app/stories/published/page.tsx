'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';
import Link from 'next/link';
import { X, Eye, Heart, Plus } from 'lucide-react';
import CreateStoryModal from '@/components/CreateStoryModal';
import { Button } from '@/components/ui/Button';
import { StoriesSkeleton } from '@/components/skeletons/StoriesSkeleton';

interface Story {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  text?: string;
  createdAt: string;
  expiresAt: string;
  user: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
    isVerified: boolean;
  };
  stats: {
    viewCount: number;
    reactionCount: number;
  };
}

interface PublishedStoriesResponse {
  success: boolean;
  data: Story[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
}

export default function PublishedStoriesPage() {
  const { translation } = useLanguage();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    skip: 0,
    hasMore: false
  });
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchPublishedStories();
  }, []);

  const fetchPublishedStories = async (skip = 0) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/stories?limit=20&skip=${skip}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch published stories');
      }

      const data: PublishedStoriesResponse = await response.json();
      if (skip > 0) {
        setStories(prev => [...prev, ...data.data]);
      } else {
        setStories(data.data);
      }
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching published stories:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStory = async (data: { text?: string; imageUrl?: string; videoUrl?: string }) => {
    const response = await fetch('/api/stories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create story');
    fetchPublishedStories();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'À l\'instant';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours}h`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days}j`;
    }
  };

  const handleLoadMore = () => {
    fetchPublishedStories(pagination.skip + pagination.limit);
  };

  if (loading && stories.length === 0) {
    return (
      <MainLayout>
        <StoriesSkeleton />
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Stories Publiées
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Découvrez les stories publiées par la communauté
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Total: {pagination.total} stories
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
            <Plus className="w-5 h-5" />
            <span>{translation.story?.createStory || 'Create story'}</span>
          </Button>
        </div>

        {/* Erreur */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6"
          >
            {error}
          </div>
        )}

        {/* Grille de Stories */}
        {stories.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <>
                {stories.map((story, index) => (
                  <div
                    key={story.id}
                    className="cursor-pointer group"
                    onClick={() => setSelectedStory(story)}
                  >
                    {/* Story Card */}
                    <div className="relative h-96 rounded-3xl overflow-hidden bg-gray-200 dark:bg-gray-700 shadow-lg hover:shadow-2xl">
                      {/* Image/Video */}
                      {story.imageUrl && (
                        <Image
                          src={story.imageUrl}
                          alt="Story"
                          fill
                          className="object-cover group-hover:scale-105"
                        />
                      )}
                      {story.videoUrl && !story.imageUrl && (
                        <video
                          src={story.videoUrl}
                          className="w-full h-full object-cover group-hover:scale-105"
                        />
                      )}
                      {story.text && !story.imageUrl && !story.videoUrl && (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
                          <p className="text-white text-center text-xl font-bold px-6 line-clamp-4">
                            {story.text}
                          </p>
                        </div>
                      )}

                      {/* Gradient overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100" />

                      {/* Text overlay au survol */}
                      {story.text && (story.imageUrl || story.videoUrl) && (
                        <div className="absolute inset-0 p-4 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <p className="text-white text-center line-clamp-3 font-semibold text-lg">
                            {story.text}
                          </p>
                        </div>
                      )}

                      {/* User Info - Top */}
                      <Link
                        href={`/users/${story.user.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-2 rounded-full hover:bg-white/20 transition-all"
                      >
                        <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white">
                          {story.user.avatar && (
                            <Image
                              src={story.user.avatar}
                              alt={story.user.username}
                              fill
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="text-white">
                          <p className="font-semibold text-xs truncate">
                            {story.user.fullName || story.user.username}
                          </p>
                          <p className="text-xs text-white/70">
                            {formatDate(story.createdAt)}
                          </p>
                        </div>
                      </Link>

                      {/* Stats - Bottom */}
                      <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <div className="flex items-center justify-between text-white">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full">
                              <Eye className="w-4 h-4" />
                              <span>{story.stats.viewCount}</span>
                            </div>
                            <div className="flex items-center gap-1 bg-black/40 px-3 py-1 rounded-full">
                              <Heart className="w-4 h-4" />
                              <span>{story.stats.reactionCount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </>
            </div>

            {/* Bouton Charger plus */}
            {pagination.hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Chargement...' : 'Charger plus'}
              </button>
            )}
          </>
        ) : (
          /* Aucune story */
          <div
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📖</div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {translation.story?.noStoriesPublished || 'No stories published'}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {translation.story?.beFirstToShare || 'Be the first to share a story!'}
            </p>
          </div>
        )}

        {/* Modal de détail */}
        {selectedStory && (
          <div
            onClick={() => setSelectedStory(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedStory(null)}
                className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Image/Video */}
              {selectedStory.imageUrl && (
                <div className="relative w-full h-96">
                  <Image
                    src={selectedStory.imageUrl}
                    alt="Story detail"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              )}
              {selectedStory.videoUrl && (
                <video
                  src={selectedStory.videoUrl}
                  controls
                  className="w-full h-96 object-cover"
                  autoPlay
                />
              )}
              {selectedStory.text && !selectedStory.imageUrl && !selectedStory.videoUrl && (
                <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
                  <p className="text-white text-center text-2xl font-bold px-8">
                    {selectedStory.text}
                  </p>
                </div>
              )}

              {/* Contenu */}
              <div className="p-6">
                {/* Utilisateur */}
                <Link
                  href={`/users/${selectedStory.user.id}`}
                  className="flex items-center gap-4 mb-6 hover:opacity-80 transition-opacity"
                >
                  {selectedStory.user.avatar && (
                    <div className="relative w-16 h-16 rounded-full overflow-hidden border-3 border-gray-200 dark:border-gray-600">
                      <Image
                        src={selectedStory.user.avatar}
                        alt={selectedStory.user.username}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="flex items-center gap-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {selectedStory.user.fullName || selectedStory.user.username}
                      </h3>
                      {selectedStory.user.isVerified && (
                        <span className="text-blue-500">✓</span>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400">
                      @{selectedStory.user.username}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      {formatDate(selectedStory.createdAt)}
                    </p>
                  </div>
                </Link>

                {/* Texte */}
                {selectedStory.text && (selectedStory.imageUrl || selectedStory.videoUrl) && (
                  <p className="text-gray-700 dark:text-gray-300 mb-6 whitespace-pre-wrap text-lg">
                    {selectedStory.text}
                  </p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {selectedStory.stats.viewCount}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Vues</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {selectedStory.stats.reactionCount}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Réactions</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <CreateStoryModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateStory} />
      </div>
    </MainLayout>
  );
}

