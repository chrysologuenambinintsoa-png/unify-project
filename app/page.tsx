'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import UnifiedPostCreator from '@/components/post/UnifiedPostCreator';
import Stories from '@/components/Stories';
import Post from '@/components/Post';
import SponsoredPostCard from '@/components/SponsoredPostCard';
import { FriendSuggestions } from '@/components/FriendSuggestions';
import { PageSuggestions } from '@/components/PageSuggestions';
import { GroupSuggestions } from '@/components/GroupSuggestions';
import { LoadingPage } from '@/components/LoadingPage';
import { PostWithDetails } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { fetchWithTimeout } from '@/lib/fetchWithTimeout';
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
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [sponsoredLoaded, setSponsoredLoaded] = useState(false);
  
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

  // Charger les posts et sponsored posts en parallèle
  useEffect(() => {
    if (session) {
      fetchAllData();
    }
  }, [session]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Charger les posts et sponsored posts en parallèle
      // Increased timeout to 15 seconds for mobile connections
      const [postsRes, sponsoredRes] = await Promise.all([
        fetchWithTimeout('/api/posts', undefined, 15000),
        fetchWithTimeout('/api/sponsored?limit=5', undefined, 15000),
      ]);
      
      // Traiter les posts
      if (postsRes.ok) {
        const data = await postsRes.json();
        setPosts(data);
        setPostsLoaded(true);
      } else {
        throw new Error('Failed to fetch posts');
      }
      
      // Traiter les sponsored posts
      if (sponsoredRes.ok) {
        const data = await sponsoredRes.json();
        setSponsoredPosts(Array.isArray(data) ? data : []);
        setSponsoredLoaded(true);
      }
    } catch (err) {
      if ((err as any)?.name === 'AbortError') {
        setError('Le chargement des publications a expiré. Vérifiez la connexion et réessayez.');
      } else {
        setError(err instanceof Error ? err.message : 'Une erreur est survenue lors du chargement');
      }
    } finally {
      setLoading(false);
    }
  };

  // Afficher un écran de chargement pendant la vérification de la session
  if (status === 'loading') {
    return <LoadingPage message="Connexion en cours..." />;
  }

  // Ne pas afficher le contenu si l'utilisateur n'est pas authentifié
  if (!session) {
    return <LoadingPage message="Redirection en cours..." />;
  }
  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/likes`, {
        method: 'POST',
      });
      if (response.ok) {
        // Recharger les posts pour mettre à jour les likes
        await fetchAllData();
      }
    } catch (err) {
      console.error('Erreur lors du like:', err);
    }
  };

  const handleDelete = async (postId: string) => {
    // First, confirm with the user
    if (!window.confirm('Are you sure you want to delete this post?')) {
      return;
    }

    // Optimistic update - remove post from UI immediately
    const previousPosts = posts;
    setPosts(prev => prev.filter(p => p.id !== postId));

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        // If deletion fails, restore the posts
        setPosts(previousPosts);
        const error = await response.json();
        alert(error.error || 'Failed to delete post');
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      // If deletion fails, restore the posts
      setPosts(previousPosts);
      alert('Error deleting post. Please try again.');
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
        await fetchAllData();
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-4 md:space-y-6 w-full">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white px-4 md:px-0">
              {translation.nav.home}
            </h1>

            <div className="px-4 md:px-0">
              <UnifiedPostCreator onCreatePost={handleCreatePost} />
            </div>

            {/* Stories Section */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl md:rounded-3xl shadow-md p-4 md:p-6 mx-4 md:mx-0">
              <div className="mb-6">
                <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">Stories</h2>
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
                <p className="text-gray-500 text-sm md:text-base">Chargement des publications...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-500 text-sm md:text-base">{error}</p>
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm md:text-base">Aucune publication pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4 px-4 md:px-0">
                {/* Afficher les annonces sponsorisées tous les 3 posts */}
                {posts.map((post, index) => (
                  <div key={post.id}>
                    <Post
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onDelete={handleDelete}
                      onCommentAdded={fetchAllData}
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

          {/* Sidebar with Suggestions - Visible on all screens, full-width on mobile */}
          <div className="w-full md:w-80 flex flex-col space-y-4 md:space-y-6 px-4 md:px-0">
            <FriendSuggestions compact />
            <div className="hidden md:block">
              <PageSuggestions compact />
            </div>
            <div className="hidden md:block">
              <GroupSuggestions compact />
            </div>
          </div>
        </div>
      </motion.div>
    </MainLayout>
  );
}