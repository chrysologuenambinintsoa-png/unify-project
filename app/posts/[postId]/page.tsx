'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import Post from '@/components/Post';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useLanguage } from '@/contexts/LanguageContext';

interface PostData {
  id: string;
  content: string;
  images?: string[];
  media?: Array<{ url: string; type: string }>;
  createdAt: string;
  user?: any;
  likes?: number | any[];
  comments?: number | any[];
  shares?: number;
  liked?: boolean;
  _count?: { likes: number; comments: number };
}

export default function PostPage() {
  const params = useParams();
  const router = useRouter();
  const { translation } = useLanguage();
  const postId = params?.postId as string;

  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) {
      setLoading(false);
      setError('ID du post invalide');
      return;
    }

    const fetchPost = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/posts/${postId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError('Post non trouvé');
          } else {
            setError('Erreur lors du chargement du post');
          }
          setPost(null);
          return;
        }

        const data = await response.json();
        setPost(data);
      } catch (err) {
        console.error('Error fetching post:', err);
        setError('Erreur lors du chargement du post');
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [postId]);

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to like post');
      
      // Refresh the post to get updated like count
      const postResponse = await fetch(`/api/posts/${postId}`);
      if (postResponse.ok) {
        const updatedPost = await postResponse.json();
        setPost(updatedPost);
      }
    } catch (err) {
      console.error('Error liking post:', err);
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

  if (error || !post) {
    return (
      <MainLayout>
        <Card className="p-8 text-center max-w-md mx-auto">
          <p className="text-gray-600 mb-4">{error || 'Post non trouvé'}</p>
          <Button
            onClick={() => router.push('/')}
            className="w-full"
          >
            Retour à l'accueil
          </Button>
        </Card>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="w-full max-w-2xl mx-auto px-3 md:px-0">
        <Post
          post={post}
          onLike={handleLike}
        />
      </div>
    </MainLayout>
  );
}
