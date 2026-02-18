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
import { FriendsDiscussions } from '@/components/FriendsDiscussions';
import { PostWithDetails, ExtendedUser } from '@/types';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHomeActivity } from '@/contexts/HomeActivityContext';
import { fetchWithTimeout, fetchWithRetry } from '@/lib/fetchWithTimeout';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { motion } from 'framer-motion';
import { HomeSkeleton } from '@/components/skeletons/HomeSkeleton';
import { PostSkeleton } from '@/components/skeletons/PostSkeleton';

export default function HomePage() {
  const { translation } = useLanguage();
  const { isReady, session } = useRequireAuth();
  const { clearHomeActivity } = useHomeActivity();
  const [posts, setPosts] = useState<PostWithDetails[]>([]);
  const [sponsoredPosts, setSponsoredPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postsLoaded, setPostsLoaded] = useState(false);
  const [sponsoredLoaded, setSponsoredLoaded] = useState(false);
  const [stories, setStories] = useState<any[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);

  // Fonction pour charger les posts et sponsored posts en parallèle avec gestion d'erreur améliorée
  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Charger les posts avec timeout plus long et retry
      let postsData: any[] = [];
      let postsError = false;
      try {
        const postsRes = await fetchWithRetry('/api/posts', undefined, 45000, 2);
        if (postsRes.ok) {
          postsData = await postsRes.json();
          if (!Array.isArray(postsData)) {
            postsData = [];
          }
        } else {
          console.error('Posts API returned', postsRes.status);
          postsError = true;
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
        postsError = true;
      }

      // Charger les sponsored posts avec gestion d'erreur gracieuse
      let sponsoredData: any[] = [];
      try {
        const sponsoredRes = await fetchWithRetry(
          '/api/sponsored?limit=5',
          undefined,
          20000,
          1
        );
        if (sponsoredRes.ok) {
          const data = await sponsoredRes.json();
          sponsoredData = Array.isArray(data) ? data : [];
        } else {
          console.warn(
            'Sponsored API returned',
            sponsoredRes.status,
            '- continuing without sponsored posts'
          );
        }
      } catch (err) {
        console.warn(
          'Error fetching sponsored posts:',
          err,
          '- continuing without sponsored posts'
        );
      }

      // Mettre à jour les données
      setPosts(postsData);
      setPostsLoaded(true);
      setSponsoredPosts(sponsoredData);
      setSponsoredLoaded(true);
      
      // Afficher une erreur uniquement si les posts n'ont pas pu être chargés
      if (postsError) {
        setError('Erreur lors du chargement des publications. Veuillez réessayer.');
      }
    } catch (err) {
      console.error('Unexpected error in fetchAllData:', err);
      setError('Une erreur inattendue s\'est produite. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le badge home quand on ouvre la page d'accueil
  useEffect(() => {
    if (isReady) {
      clearHomeActivity();
    }
  }, [clearHomeActivity, isReady]);

  // Charger les posts et sponsored posts en parallèle
  useEffect(() => {
    if (session && isReady) {
      fetchAllData();
      // Auto-refresh disabled to prevent continuous reloading and data loss during interactions
    }
  }, [session, isReady]);

  // Charger les stories publiées
  useEffect(() => {
    const loadStories = async () => {
      try {
        setStoriesLoading(true);
        const res = await fetch('/api/stories/published?limit=50');
        if (res.ok) {
          const json = await res.json();
          const list = Array.isArray(json) ? json : (json?.data || []);
          setStories(list.map((story: any) => ({
            id: story.id,
            user: {
              name: story.user.fullName || story.user.username,
              avatar: story.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.user.id || story.user.username || 'user'}`
            },
            image: story.imageUrl,
            timestamp: new Date(story.createdAt),
            viewed: false
          })));
        }
      } catch (err) {
        console.error('Erreur lors du chargement des stories:', err);
      } finally {
        setStoriesLoading(false);
      }
    };
    
    if (isReady) {
      loadStories();
    }
  }, [isReady]);

  // Ne rien retourner si pas prêt (évite page vide/grise)
  if (!isReady) {
    return (
      <MainLayout>
        <HomeSkeleton />
      </MainLayout>
    );
  }

  const handleLike = async (postId: string) => {
    try {
      // Optimistic update - add/remove like from the likes array immediately
      setPosts(prev => prev.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              likes: Array.isArray(p.likes) && p.likes.length > 0
                ? p.likes.slice(0, -1)
                : [...(p.likes || []), { id: 'temp', userId: session?.user?.id || '', createdAt: new Date(), user: session?.user as ExtendedUser }]
            }
          : p
      ));

      const response = await fetch(`/api/posts/${postId}/likes`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        // Revert optimistic update on error - just refetch the posts
        const res = await fetch('/api/posts?sort=newest&limit=50');
        if (res.ok) {
          const data = await res.json();
          setPosts(data.posts || []);
        }
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

      console.log('Post creation response:', { status: response.status, statusText: response.statusText });

      if (response.ok) {
        const createdPost = await response.json();
        
        // Optimistically add the new post to the list instead of reloading all posts
        const optimisticPost = {
          ...createdPost,
          user: session?.user as ExtendedUser,
          _count: { likes: 0, comments: 0 },
          liked: false,
        };
        setPosts(prev => [optimisticPost, ...prev]);
        
        // Also add images to user's photo gallery
        if (newPost.images && newPost.images.length > 0 && session?.user?.id) {
          for (const imageUrl of newPost.images) {
            try {
              const photoRes = await fetch(`/api/users/${session.user.id}/photos`, {
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
              
              if (!photoRes.ok) {
                const photoError = await photoRes.json().catch(() => ({ error: 'Unknown error' }));
                console.warn('Warning: Photo not added to gallery:', photoError);
                // Don't fail the post creation, just log warning
              }
            } catch (err) {
              console.warn('Warning: Error adding photo to gallery:', err);
              // Don't fail the post creation, just log warning
            }
          }
        }
      } else {
        const error = await response.json().catch(() => ({ error: 'Failed to create post' }));
        const errorMessage = error?.details || error?.error || error?.message || 'Failed to create post';
        const logObject = JSON.stringify({ 
          status: response.status, 
          error: JSON.stringify(error),
          errorMessage
        });
        console.error('Error creating post:', logObject);
        
        // User-friendly error messages
        let userMessage = errorMessage;
        if (errorMessage.includes('User not found') || errorMessage.includes('posts_userId_fkey')) {
          userMessage = 'Your session has expired. Please log in again.';
        }
        
        alert(`Error: ${userMessage}`);
      }
    } catch (err) {
      console.error('Network error creating post:', {
        message: err instanceof Error ? err.message : String(err),
        name: err instanceof Error ? err.name : 'Unknown',
        stack: err instanceof Error ? err.stack : undefined,
      });
      const errorMessage = err instanceof Error ? err.message : 'Failed to create post';
      alert(`Error: ${errorMessage}`);
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
                stories={stories}
                currentUser={session?.user as any}
                onCreated={() => {
                  // Refresh stories after creation
                  const loadStories = async () => {
                    try {
                      const res = await fetch('/api/stories/published?limit=50');
                      if (res.ok) {
                        const json = await res.json();
                        const list = Array.isArray(json) ? json : (json?.data || []);
                        setStories(list.map((story: any) => ({
                          id: story.id,
                          user: {
                            name: story.user.fullName || story.user.username,
                            avatar: story.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${story.user.id || story.user.username || 'user'}`
                          },
                          image: story.imageUrl,
                          timestamp: new Date(story.createdAt),
                          viewed: false
                        })));
                      }
                    } catch (err) {
                      console.error('Erreur lors du chargement des stories:', err);
                    }
                  };
                  loadStories();
                }}
              />
            </div>
            {loading ? (
              <div className="space-y-3 md:space-y-4 px-4 md:px-0">
                {[0, 1, 2].map((i) => (
                  <PostSkeleton key={i} />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-sm md:text-base">Aucune publication pour le moment.</p>
              </div>
            ) : (
              <div className="space-y-3 md:space-y-4 px-4 md:px-0">
                {error && (
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30 text-yellow-800 dark:text-yellow-200 rounded-lg p-4 mb-4 flex justify-between items-center">
                    <span className="text-sm">{error}</span>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={fetchAllData}
                      className="ml-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 text-white rounded text-xs font-medium transition-colors"
                    >
                      Réessayer
                    </motion.button>
                  </div>
                )}
                {/* Afficher les annonces sponsorisées tous les 3 posts */}
                {posts.map((post, index) => (
                  <div key={post.id}>
                    <Post
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onDelete={handleDelete}
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
            <FriendsDiscussions limit={8} />
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