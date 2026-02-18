'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeft, ChevronRight, Share2, Heart, MessageCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import UnifiedViewer from '@/components/viewer/UnifiedViewer';

interface Post {
  id: string;
  content: string;
  background?: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar?: string;
    isVerified?: boolean;
  };
  media: Array<{
    id: string;
    type: 'image' | 'video';
    url: string;
  }>;
  comments: Array<{
    id: string;
    content: string;
    user: {
      id: string;
      username: string;
      fullName: string;
      avatar?: string;
    };
  }>;
  reactions: Array<{
    id: string;
    emoji: string;
    user: {
      id: string;
      username: string;
      fullName: string;
    };
  }>;
  _count: {
    likes: number;
    comments: number;
    reactions: number;
    shares: number;
  };
}

export default function PhotoViewerClient({ postId }: { postId: string }) {
  const { translation } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaIndex, setMediaIndex] = useState(Number(searchParams?.get('mediaIndex')) || 0);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [reactions, setReactions] = useState<Array<{ emoji: string; count: number }>>([]);
  const isFetchingRef = useRef(false);

  useEffect(() => {
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  const fetchPost = async () => {
    if (isFetchingRef.current) {
      console.debug('[PhotoViewerClient] fetchPost skipped: already fetching');
      return;
    }
    try {
      isFetchingRef.current = true;
      setLoading(true);
      const response = await fetch(`/api/posts/${postId}`);
      console.debug('[PhotoViewerClient] fetch /api/posts/', postId, 'status', response.status);
      if (!response.ok) throw new Error('Failed to fetch post');
      const data = await response.json();
      setPost(data);
      fetchReactions();
    } catch (err) {
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  const fetchReactions = async () => {
    if (isFetchingRef.current) {
      console.debug('[PhotoViewerClient] fetchReactions skipped: post fetch in progress');
      return;
    }
    try {
      const response = await fetch(`/api/posts/${postId}/reactions`);
      console.debug('[PhotoViewerClient] fetch /api/posts/' + postId + '/reactions status', response.status);
      if (response.ok) {
        const data = await response.json();
        setReactions(data.reactions || []);
      }
    } catch (err) {
      console.error('Error fetching reactions:', err);
    }
  };

  const submitComment = async () => {
    if (!commentText.trim() || !session?.user?.id) return;
    try {
      setCommentLoading(true);
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });
      if (!res.ok) throw new Error('Failed to comment');
      setCommentText('');
      await fetchPost();
    } catch (err) {
      console.error('Comment error', err);
      alert('Erreur lors de l\'envoi du commentaire');
    } finally {
      setCommentLoading(false);
    }
  };

  const addReaction = async (emoji: string) => {
    try {
      const res = await fetch(`/api/posts/${postId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      if (!res.ok) throw new Error('Failed to add reaction');
      await fetchReactions();
    } catch (err) {
      console.error('Reaction error', err);
    }
  };

  const handleShare = async () => {
    const type = prompt('Partager vers: "message" ou "group"?');
    if (!type || (type !== 'message' && type !== 'group')) return;

    if (type === 'message') {
      const recipientId = prompt('ID du destinataire');
      if (!recipientId) return;
      const message = prompt('Message optionnel');
      const res = await fetch(`/api/posts/${postId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareType: 'message', recipientId, message }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Erreur de partage');
        return;
      }
      alert('Partagé en message');
    } else if (type === 'group') {
      const groupId = prompt('ID du groupe');
      if (!groupId) return;
      const message = prompt('Message optionnel');
      const res = await fetch(`/api/posts/${postId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareType: 'group', groupId, message }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Erreur de partage');
        return;
      }
      alert('Partagé dans le groupe');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500">Chargement...</p>
        </div>
      </MainLayout>
    );
  }

  if (!post) {
    return (
      <MainLayout>
        <div className="text-center py-12">Post non trouvé</div>
      </MainLayout>
    );
  }

  const currentMedia = post.media[mediaIndex];

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto py-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          <ChevronLeft size={20} />
          Retour
        </button>

        <UnifiedViewer
          post={post}
          initialIndex={mediaIndex}
          isOpen={true}
          onClose={() => router.back()}
          onLike={async (postId: string) => {
            try {
              await fetch(`/api/posts/${postId}/like`, { method: 'POST' });
              await fetchPost();
            } catch (err) {
              console.error('Like error', err);
            }
          }}
        />
      </div>
    </MainLayout>
  );
}
