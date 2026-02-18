'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeft } from 'lucide-react';
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
    } catch (err) {
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center">
        <div className="text-center py-12">
          <p className="text-white mb-4">Post non trouvé</p>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
          >
            <ChevronLeft size={20} />
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
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
  );
}
