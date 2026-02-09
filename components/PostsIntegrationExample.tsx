/**
 * Exemple d'intégration des APIs Posts, Commentaires et Réactions
 * dans les composants React
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// ============================================================================
// 1. HOOK PERSONNALISÉ POUR RÉCUPÉRER LES POSTS
// ============================================================================

export function usePosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Realtime subscription via WebSocket (connects to local ws server)
    let ws: WebSocket | null = null;
    let reconnectTimer: any = null;

    const connect = () => {
      const proto = location.protocol === 'https:' ? 'wss' : 'ws';
      const url = proto + '://' + location.host + '/ws';
      try {
        ws = new WebSocket(url);
      } catch (e) {
        // fallback to explicit localhost
        ws = new WebSocket((location.protocol === 'https:' ? 'wss' : 'ws') + '://localhost:3000/ws');
      }

      ws.onmessage = (ev) => {
        try {
          const event = JSON.parse(ev.data);
          if (!event || !event.type) return;
          setPosts((prev) => {
            if (event.type === 'created') {
              return [event.payload, ...prev].filter(Boolean);
            }
            if (event.type === 'updated') {
              return prev.map((p) => (p.id === event.payload.id ? event.payload : p));
            }
            if (event.type === 'deleted') {
              return prev.filter((p) => p.id !== event.payload.id);
            }
            if (event.type === 'reaction') {
              return prev.map((p) => (p.id === event.payload.id ? { ...p, _count: event.payload._count } : p));
            }
            return prev;
          });
        } catch (e) {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        // try reconnect
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(connect, 2000);
      };

      ws.onerror = () => {
        ws?.close();
      };
    };

    connect();

    return () => {
      if (reconnectTimer) clearTimeout(reconnectTimer);
      ws?.close();
    };
  }, []);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/posts');
      if (!response.ok) throw new Error('Failed to fetch posts');
      const data = await response.json();
      // Server already filters to last 72h; ensure client-side as well
      const cutoff = Date.now() - 72 * 60 * 60 * 1000;
      setPosts((data || []).filter((p: any) => new Date(p.createdAt).getTime() >= cutoff));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { posts, loading, error, refetch: fetchPosts };
}

// ============================================================================
// 2. HOOK PERSONNALISÉ POUR UN POST UNIQUE
// ============================================================================

export function usePost(postId: string) {
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${postId}`);
      if (!response.ok) throw new Error('Failed to fetch post');
      const data = await response.json();
      setPost(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return { post, loading, error, refetch: fetchPost };
}

// ============================================================================
// 3. HOOK PERSONNALISÉ POUR GÉRER LES RÉACTIONS
// ============================================================================

export function useReactions(postId: string, type: 'post' | 'comment' = 'post', commentId?: string) {
  const [reactions, setReactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReactions();
  }, [postId, commentId]);

  const getReactionsUrl = () => {
    if (type === 'comment' && commentId) {
      return `/api/posts/${postId}/comments/${commentId}/reactions`;
    }
    return `/api/posts/${postId}/reactions`;
  };

  const fetchReactions = async () => {
    try {
      const response = await fetch(getReactionsUrl());
      if (!response.ok) throw new Error('Failed to fetch reactions');
      const data = await response.json();
      setReactions(data.reactions || []);
    } catch (err) {
      console.error('Error fetching reactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const addReaction = async (emoji: string) => {
    try {
      const response = await fetch(getReactionsUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      if (!response.ok) throw new Error('Failed to add reaction');
      await fetchReactions();
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
  };

  const removeReaction = async (emoji: string) => {
    try {
      const response = await fetch(getReactionsUrl(), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
      if (!response.ok) throw new Error('Failed to remove reaction');
      await fetchReactions();
    } catch (err) {
      console.error('Error removing reaction:', err);
    }
  };

  return { reactions, loading, addReaction, removeReaction };
}

// ============================================================================
// 4. COMPOSANT - AFFICHAGE D'UN POST
// ============================================================================

export function PostCard({ postId }: { postId: string }) {
  const router = useRouter();
  const { post, loading, error, refetch } = usePost(postId);
  const { reactions, addReaction, removeReaction } = useReactions(postId);
  const [commentText, setCommentText] = useState('');

  const submitComment = async () => {
    if (!commentText.trim()) return;
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || 'Failed to comment');
      }
      setCommentText('');
      // refresh post to show new comment
      await refetch();
    } catch (e) {
      console.error('Comment error', e);
      alert('Erreur lors de l\'envoi du commentaire');
    }
  };

  const handleShare = async () => {
    const type = prompt('Partager vers: "message" ou "group"? (tape message ou group)');
    if (!type) return;
    if (type !== 'message' && type !== 'group') {
      alert('Type invalide');
      return;
    }

    if (type === 'message') {
      const recipientId = prompt('ID du destinataire (user id)');
      if (!recipientId) return;
      const message = prompt('Message optionnel');
      const res = await fetch(`/api/posts/${postId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareType: 'message', recipientId, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erreur de partage');
        return;
      }
      alert('Partagé en message');
      return;
    }

    if (type === 'group') {
      const groupId = prompt('ID du groupe');
      if (!groupId) return;
      const message = prompt('Message optionnel');
      const res = await fetch(`/api/posts/${postId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shareType: 'group', groupId, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Erreur de partage');
        return;
      }
      alert('Partagé dans le groupe');
      return;
    }
  };

  if (loading) return null;
  if (error) return <div className="p-4 text-red-500">Erreur: {error}</div>;
  if (!post) return null;

  return (
    <div className="border rounded-lg p-4 mb-4">
      {/* Auteur */}
      <div className="flex items-center mb-3">
        {post.user.avatar && (
          <img
            src={post.user.avatar}
            alt={post.user.username}
            className="w-10 h-10 rounded-full mr-3"
          />
        )}
        <div>
          <p className="font-semibold">{post.user.fullName}</p>
          <p className="text-sm text-gray-600">@{post.user.username}</p>
        </div>
      </div>

      {/* Contenu */}
      <p className="mb-4">{post.content}</p>

      {/* Médias: click to open viewer page */}
      {post.media && post.media.length > 0 && (
        <div className="mb-4">
          <div className="flex space-x-2 overflow-auto">
            {post.media.map((media: any, idx: number) => (
              <div
                key={media.id}
                className="flex-shrink-0 w-40 h-28 rounded overflow-hidden cursor-pointer hover:opacity-80 transition"
                onClick={() => router.push(`/posts/${postId}/photo?mediaIndex=${idx}`)}
              >
                {media.type === 'image' && (
                  <img src={media.url} alt="Media" className="object-cover w-full h-full" />
                )}
                {media.type === 'video' && (
                  <video src={media.url} className="object-cover w-full h-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compteurs */}
      <div className="flex gap-4 mb-4 text-sm text-gray-600">
        <span>{post._count?.comments || 0} commentaires</span>
        <span>{post._count?.likes || 0} j'aime</span>
        <span>{post._count?.reactions || 0} réactions</span>
      </div>

      {/* Barre de réactions */}
      <ReactionBar
        reactions={reactions}
        onAddReaction={addReaction}
        onRemoveReaction={removeReaction}
      />

      {/* Commentaires */}
      {post.comments && post.comments.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h3 className="font-semibold mb-3">Commentaires</h3>
          {post.comments.map((comment: any) => (
            <CommentItem
              key={comment.id}
              postId={postId}
              comment={comment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 5. COMPOSANT - AFFICHAGE D'UN COMMENTAIRE
// ============================================================================

export function CommentItem({ postId, comment }: { postId: string; comment: any }) {
  const [showReplies, setShowReplies] = useState(false);
  const { reactions, addReaction } = useReactions(postId, 'comment', comment.id);

  return (
    <div className="mb-3 pb-3 border-b">
      {/* Auteur du commentaire */}
      <div className="flex items-center mb-2">
        {comment.user.avatar && (
          <img
            src={comment.user.avatar}
            alt={comment.user.username}
            className="w-8 h-8 rounded-full mr-2"
          />
        )}
        <div>
          <p className="font-semibold text-sm">{comment.user.fullName}</p>
          <p className="text-xs text-gray-600">@{comment.user.username}</p>
        </div>
      </div>

      {/* Contenu du commentaire */}
      <p className="text-sm mb-2">{comment.content}</p>

      {/* Réactions du commentaire */}
      <div className="flex items-center gap-2 mb-2">
        {reactions.map((reaction) => (
          <button
            key={reaction.emoji}
            className="flex items-center gap-1 px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 text-sm"
            onClick={() => addReaction(reaction.emoji)}
          >
            <span>{reaction.emoji}</span>
            <span className="text-xs">{reaction.count}</span>
          </button>
        ))}
        <button
          className="px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
          onClick={() => {
            // Ouvrir sélecteur d'emoji
            addReaction('👍');
          }}
        >
          +
        </button>
      </div>

      {/* Réponses */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 mt-2">
          <button
            className="text-sm text-blue-600 hover:underline"
            onClick={() => setShowReplies(!showReplies)}
          >
            {showReplies ? 'Masquer' : `Afficher ${comment.replies.length} réponse(s)`}
          </button>

          {showReplies && (
            <div className="mt-2">
              {comment.replies.map((reply: any) => (
                <div key={reply.id} className="ml-4 mb-2 pb-2 border-l">
                  <p className="font-semibold text-sm">{reply.user.fullName}</p>
                  <p className="text-sm">{reply.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// 6. COMPOSANT - BARRE DE RÉACTIONS
// ============================================================================

export function ReactionBar({
  reactions,
  onAddReaction,
  onRemoveReaction,
}: {
  reactions: any[];
  onAddReaction: (emoji: string) => void;
  onRemoveReaction: (emoji: string) => void;
}) {
  const emojis = ['👍', '❤️', '😂', '😢', '😡', '🎉'];
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          className="flex items-center gap-1 px-3 py-1 rounded bg-white border border-gray-300 hover:bg-gray-100"
          onClick={() => onRemoveReaction(reaction.emoji)}
        >
          <span>{reaction.emoji}</span>
          <span className="text-sm">{reaction.count}</span>
        </button>
      ))}

      <div className="relative">
        <button
          className="px-3 py-1 text-gray-600 hover:bg-gray-200 rounded"
          onClick={() => setShowPicker(!showPicker)}
        >
          😊
        </button>

        {showPicker && (
          <div className="absolute top-full mt-1 left-0 bg-white border rounded shadow-lg p-2">
            <div className="flex flex-wrap gap-1 w-48">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  className="text-2xl hover:scale-110 transition"
                  onClick={() => {
                    onAddReaction(emoji);
                    setShowPicker(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 7. COMPOSANT - FORMULAIRE DE CRÉATION DE POST
// ============================================================================

export function CreatePostForm({ onPostCreated }: { onPostCreated: () => void }) {
  const [content, setContent] = useState('');
  const [background, setBackground] = useState('#FFFFFF');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          background,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create post');
      }

      setContent('');
      onPostCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border rounded-lg p-4 mb-4">
      <div className="mb-3">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Quoi de neuf?"
          className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Couleur de fond</label>
        <input
          type="color"
          value={background}
          onChange={(e) => setBackground(e.target.value)}
          className="w-12 h-10 border rounded cursor-pointer"
        />
      </div>

      {error && <div className="mb-3 text-red-500 text-sm">{error}</div>}

      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="w-full bg-blue-500 text-white py-2 rounded font-semibold hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? 'Publication...' : 'Publier'}
      </button>
    </form>
  );
}

// ============================================================================
// 8. COMPOSANT - PAGE PRINCIPALE
// ============================================================================

export function PostsFeed() {
  const { posts, loading, error, refetch } = usePosts();

  if (loading) return null;
  if (error) return <div className="p-4 text-red-500">Erreur: {error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Feed</h1>

      <CreatePostForm onPostCreated={refetch} />

      <div>
        {posts.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Aucun post pour le moment
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} postId={post.id} />
          ))
        )}
      </div>
    </div>
  );
}
