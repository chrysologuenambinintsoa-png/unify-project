'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import PostCreator from '@/components/post/PostCreator';
import Stories from '@/components/Stories';
import Post from '@/components/Post';
import SponsoredPostCard from '@/components/SponsoredPostCard';
import { FriendSuggestions } from '@/components/FriendSuggestions';
import { PageSuggestions } from '@/components/PageSuggestions';
import { GroupSuggestions } from '@/components/GroupSuggestions';
import { PostWithDetails } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHomeActivity } from '@/contexts/HomeActivityContext';
import { usePublishedStories } from '@/hooks/usePublishedStories';
import { motion } from 'framer-motion';

export default function HomePage() {
  const { translation } = useLanguage();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { clearHomeActivity } = useHomeActivity();
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [sponsoredPosts, setSponsoredPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Utiliser le hook pour récupérer les stories publiées
  const { stories, loading: storiesLoading, refresh: refreshStories } = usePublishedStories({ limit: 50 });

  // Rediriger vers la page de login si pas d'utilisateur connecté
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  // Réinitialiser le badge home quand on ouvre la page d'accueil
  useEffect(() => {
    clearHomeActivity();
  }, [clearHomeActivity]);

  // Charger les posts
  useEffect(() => {
    if (session) {
      fetchPosts();
      fetchSponsoredPosts();
    }
  }, [session]);

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

  const fetchSponsoredPosts = async () => {
    try {
      const response = await fetch('/api/sponsored?limit=5');
      if (response.ok) {
        const data = await response.json();
        setSponsoredPosts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error fetching sponsored posts:', err);
    }
  };

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

  const handleCreatePost = async (newPost: any) => {
    try {
      const media: any[] = [];
      
      // Ajouter les images (ce sont maintenant des URLs)
      if (newPost.images && newPost.images.length > 0) {
        newPost.images.forEach((url: string) => {
          media.push({ type: 'image', url });
        });
      }
      
      // Ajouter les vidéos (ce sont maintenant des URLs)
      if (newPost.videos && newPost.videos.length > 0) {
        newPost.videos.forEach((url: string) => {
          media.push({ type: 'video', url });
        });
      }

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newPost.content,
          media: media.length > 0 ? media : undefined,
        }),
      });
      if (response.ok) {
        // Also add images to user's photo gallery
        if (newPost.images && newPost.images.length > 0 && session?.user?.id) {
          for (const imageUrl of newPost.images) {
            try {
              await fetch(`/api/users/${session.user.id}/photos`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  url: imageUrl,
                  type: 'gallery',
                  caption: '',
                }),
              });
            } catch (err) {
              console.error('Error adding photo to gallery:', err);
            }
          }
        }
        await fetchPosts();
      } else {
        const error = await response.json();
        console.error('Erreur lors de la création du post:', error);
      }
    } catch (err) {
      console.error('Erreur lors de la création du post:', err);
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

            <PostCreator onCreatePost={handleCreatePost} />

            {/* Stories Section */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Stories</h2>
              </div>
              <Stories 
                stories={stories.map(story => ({
                  id: story.id,
                  user: {
                    name: story.user.fullName || story.user.username,
                    avatar: story.user.avatar || 'https://via.placeholder.com/40'
                  },
                  image: story.imageUrl || 'https://via.placeholder.com/300x500',
                  timestamp: new Date(story.createdAt),
                  viewed: false
                }))} 
                currentUser={session?.user as any}
                onCreated={refreshStories}
              />
            </div>
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
                {/* Afficher les annonces sponsorisées tous les 3 posts */}
                {posts.map((post, index) => (
                  <div key={post.id}>
                    <Post
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onDelete={handleDelete}
                      onCommentAdded={fetchPosts}
                    />
                    {/* Afficher une annonce tous les 3 posts */}
                    {sponsoredPosts.length > 0 && index > 0 && (index + 1) % 3 === 0 && (
                      <SponsoredPostCard
                        key={`sponsored-${index}`}
                        {...sponsoredPosts[Math.floor(index / 3) % sponsoredPosts.length]}
                      />
                    )}
                  </div>
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