'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import Post from '@/components/Post';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PostData {
  id: string;
  content: string;
  images?: string[];
  media?: Array<{ url: string }>;
  createdAt: string;
  author?: any;
  user?: any;
  likes?: number | any[];
  comments?: number | any[];
  shares?: number;
  liked?: boolean;
  _count?: { likes: number; comments: number };
}

export default function UserPostsPage() {
  const params = useParams();
  const { translation } = useLanguage();
  const userId = params?.userId as string;

  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch user profile
        const profileResponse = await fetch(`/api/users/${userId}/profile`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setProfile(profileData.user);
        }

        // Fetch user posts
        const postsResponse = await fetch(`/api/users/${userId}/posts`);
        if (!postsResponse.ok) {
          setError('Erreur lors du chargement des publications');
          setPosts([]);
          return;
        }

        const postsData = await postsResponse.json();
        setPosts(Array.isArray(postsData) ? postsData : postsData.posts || []);
      } catch (err) {
        console.error('Error fetching posts:', err);
        setError('Erreur lors du chargement des publications');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Back button and header */}
        <div className="flex items-center gap-3 mb-6">
          <Link href={`/users/${userId}/profile`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {profile?.fullName || 'Utilisateur'}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {posts.length} publication{posts.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <Card className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </Card>
        )}

        {/* Posts list */}
        {posts.length > 0 ? (
          <div className="space-y-4 sm:space-y-6">
            {posts.map((post) => (
              <Post key={post.id} post={post} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {translation.pageLabels?.noPublications || 'No publications yet'}
            </p>
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
