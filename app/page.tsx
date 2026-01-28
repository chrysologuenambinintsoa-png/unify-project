'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { CreatePost } from '@/components/post/CreatePost';
import { CreateStory } from '@/components/CreateStory';
import { Stories } from '@/components/Stories';
import { Post } from '@/components/post/Post';
import { FriendSuggestions } from '@/components/FriendSuggestions';
import { PageSuggestions } from '@/components/PageSuggestions';
import { GroupSuggestions } from '@/components/GroupSuggestions';
import { PostWithDetails } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { translation } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rediriger vers la page de login si pas d'utilisateur connecté
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Afficher un écran de chargement pendant la vérification de la session
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Ne pas afficher le contenu si l'utilisateur n'est pas authentifié
  if (!session) {
    return null;
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/posts');
      if (!response.ok) {
        throw new Error('Failed to fetch posts');
      }
      const data = await response.json();
      setPosts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/likes`, {
        method: 'POST',
      });
      if (response.ok) {
        // Recharger les posts pour mettre à jour les likes
        await fetchPosts();
      }
    } catch (err) {
      console.error('Erreur lors du like:', err);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        // Recharger les posts après suppression
        await fetchPosts();
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    }
  };

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {translation.nav.home}
            </h1>

            <CreatePost />

            <CreateStory />

            <Stories />

            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-gray-500">Chargement des publications...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500">{error}</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucune publication pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post) => (
                  <Post
                    key={post.id}
                    post={post}
                    onLike={handleLike}
                    onDelete={handleDelete}
                    onCommentAdded={fetchPosts}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar with Suggestions */}
          <div className="space-y-6">
            <FriendSuggestions compact />
            <PageSuggestions compact />
            <GroupSuggestions compact />
          </div>
        </div>
      </motion.div>
    </MainLayout>
  );
}