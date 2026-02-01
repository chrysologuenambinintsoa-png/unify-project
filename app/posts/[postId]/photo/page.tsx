'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { ChevronLeft, ChevronRight, Share2, Heart, MessageCircle } from 'lucide-react';

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

export default function PhotoViewer({ params }: { params: { postId: string } }) {
  const { translation } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [mediaIndex, setMediaIndex] = useState(Number(searchParams.get('mediaIndex')) || 0);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [reactions, setReactions] = useState<Array<{ emoji: string; count: number }>>([]);

  useEffect(() => {
    fetchPost();
  }, [params.postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${params.postId}`);
      if (!response.ok) throw new Error('Failed to fetch post');
      const data = await response.json();
      setPost(data);
      fetchReactions();
    } catch (err) {
      console.error('Error fetching post:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReactions = async () => {
    try {
      const response = await fetch(`/api/posts/${params.postId}/reactions`);
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
      const res = await fetch(`/api/posts/${params.postId}/comments`, {
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
      const res = await fetch(`/api/posts/${params.postId}/reactions`, {
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
      const res = await fetch(`/api/posts/${params.postId}/share`, {
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
      const res = await fetch(`/api/posts/${params.postId}/share`, {
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
        >
          <ChevronLeft size={20} />
          Retour
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Left: Photo */}
          <div className="lg:col-span-2 bg-black flex items-center justify-center min-h-96">
            {currentMedia && (
              <div className="w-full h-full flex items-center justify-center">
                {currentMedia.type === 'image' ? (
                  <img
                    src={currentMedia.url}
                    alt="Photo"
                    className="max-w-full max-h-96 object-contain"
                  />
                ) : (
                  <video
                    src={currentMedia.url}
                    controls
                    className="max-w-full max-h-96 object-contain"
                  />
                )}
              </div>
            )}

            {/* Photo navigation */}
            {post.media.length > 1 && (
              <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                <button
                  onClick={() =>
                    setMediaIndex((prev) =>
                      prev === 0 ? post.media.length - 1 : prev - 1
                    )
                  }
                  className="bg-black bg-opacity-60 text-white p-2 rounded hover:bg-opacity-80"
                >
                  <ChevronLeft size={20} />
                </button>
                <div className="flex-1 flex items-center justify-center text-white text-sm bg-black bg-opacity-60 rounded">
                  {mediaIndex + 1} / {post.media.length}
                </div>
                <button
                  onClick={() =>
                    setMediaIndex((prev) =>
                      prev === post.media.length - 1 ? 0 : prev + 1
                    )
                  }
                  className="bg-black bg-opacity-60 text-white p-2 rounded hover:bg-opacity-80"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Right: Actions & Comments */}
          <div className="lg:col-span-1 p-6 flex flex-col bg-gray-50">
            {/* Owner Profile */}
            <div className="mb-6 pb-6 border-b">
              <div className="flex items-center gap-3">
                {post.user.avatar && (
                  <img
                    src={post.user.avatar}
                    alt={post.user.username}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                )}
                <div className="flex-1">
                  <div className="font-bold text-lg">{post.user.fullName}</div>
                  <div className="text-gray-600 text-sm">@{post.user.username}</div>
                  {post.user.isVerified && (
                    <div className="text-blue-600 text-xs font-semibold">✓ Vérifié</div>
                  )}
                </div>
              </div>
              <p className="mt-4 text-gray-700">{post.content}</p>
            </div>

            {/* Stats */}
            <div className="mb-4 p-4 bg-white rounded border border-gray-200">
              <div className="grid grid-cols-3 text-center text-sm">
                <div>
                  <div className="font-bold text-lg">{post._count?.likes || 0}</div>
                  <div className="text-gray-600">Likes</div>
                </div>
                <div>
                  <div className="font-bold text-lg">{post._count?.comments || 0}</div>
                  <div className="text-gray-600">Commentaires</div>
                </div>
                <div>
                  <div className="font-bold text-lg">{post._count?.reactions || 0}</div>
                  <div className="text-gray-600">Réactions</div>
                </div>
              </div>
            </div>

            {/* Reactions */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-600 mb-2">RÉAGIR</p>
              <div className="grid grid-cols-3 gap-2">
                {['👍', '❤️', '😂', '😢', '😡', '🎉'].map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addReaction(emoji)}
                    className="p-2 bg-white border border-gray-300 rounded hover:bg-gray-100 text-xl transition"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {reactions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {reactions.map((r) => (
                    <span key={r.emoji} className="text-xs bg-white border border-gray-200 rounded px-2 py-1">
                      {r.emoji} {r.count}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Commentaire"]') as HTMLInputElement;
                  input?.focus();
                }}
                className="flex items-center justify-center gap-2 p-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition"
              >
                <Share2 size={16} />
                Partager
              </button>
              <button
                onClick={() => {
                  const input = document.querySelector('input[placeholder="Commentaire"]') as HTMLInputElement;
                  input?.focus();
                }}
                className="flex items-center justify-center gap-2 p-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition"
              >
                <MessageCircle size={16} />
                Commenter
              </button>
            </div>

            {/* Comment input */}
            <div className="mb-4">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && submitComment()}
                placeholder="Commentaire..."
                className="w-full p-2 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={submitComment}
                disabled={commentLoading || !commentText.trim()}
                className="w-full mt-2 p-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {commentLoading ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>

            {/* Comments section */}
            <div className="flex-1 overflow-y-auto">
              <p className="text-xs font-semibold text-gray-600 mb-3">COMMENTAIRES ({post.comments.length})</p>
              <div className="space-y-3">
                {post.comments.length > 0 ? (
                  post.comments.map((comment) => (
                    <div key={comment.id} className="p-3 bg-white rounded border border-gray-200">
                      <div className="flex items-center gap-2 mb-1">
                        {comment.user.avatar && (
                          <img
                            src={comment.user.avatar}
                            alt={comment.user.username}
                            className="w-6 h-6 rounded-full"
                          />
                        )}
                        <div className="text-sm">
                          <div className="font-semibold">{comment.user.fullName}</div>
                          <div className="text-xs text-gray-600">@{comment.user.username}</div>
                        </div>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 text-center py-4">Aucun commentaire</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
