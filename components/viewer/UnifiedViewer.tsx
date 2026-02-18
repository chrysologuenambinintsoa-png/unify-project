"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { Header } from '@/components/layout/Header';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface UnifiedViewerProps {
  post: any;
  initialIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export default function UnifiedViewer({ post, initialIndex = 0, isOpen, onClose, onLike, onDelete }: UnifiedViewerProps) {
  const [index, setIndex] = useState(initialIndex);
  const [liked, setLiked] = useState(!!post?.liked);
  const [reactions, setReactions] = useState<Array<{ id: string; emoji: string }>>([]);
  const [reactionsCount, setReactionsCount] = useState<number>(post?._count?.reactions ?? 0);
  const images: string[] = post?.images ?? (post?.media ? post.media.filter((m: any) => m.type === 'image').map((m: any) => m.url) : []);
  const videos: string[] = post?.videos ?? (post?.media ? post.media.filter((m: any) => m.type === 'video').map((m: any) => m.url) : []);
  const allMedia: Array<{ type: 'image' | 'video'; url: string }> = [
    ...images.map(url => ({ type: 'image' as const, url })),
    ...videos.map(url => ({ type: 'video' as const, url })),
  ];

  const current = allMedia[index];
  const touchStart = useRef<number | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const { data: session } = useSession();
  const router = useRouter();
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());

  const prev = useCallback(() => setIndex((i) => (i === 0 ? allMedia.length - 1 : i - 1)), [allMedia.length]);
  const next = useCallback(() => setIndex((i) => (i === allMedia.length - 1 ? 0 : i + 1)), [allMedia.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, prev, next, onClose]);

  // Close "more" menu on outside click or Escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!moreMenuRef.current) return;
      const target = e.target as Node;
      if (moreMenuRef.current && !moreMenuRef.current.contains(target)) {
        setShowMoreMenu(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMoreMenu(false);
    };
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !post) return;
    // load comments when viewer opens
    (async () => {
      try {
        const res = await fetch(`/api/posts/${post.id}/comments`);
        if (res.ok) {
          const data = await res.json();
          setComments(data.comments || data || []);
        }
      } catch (err) {
        console.warn('Failed to load comments', err);
      }
    })();
  }, [isOpen, post]);

  if (!isOpen || !post || allMedia.length === 0) return null;

  const handleLike = () => {
    console.debug('[Viewer] Like clicked, current liked state:', liked);
    setLiked(!liked);
    if (!liked) {
      onLike?.(post.id);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    console.debug('[Viewer] Comment like clicked:', commentId);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.liked) {
          setLikedComments((p) => new Set([...p, commentId]));
        } else {
          setLikedComments((p) => {
            const s = new Set(p);
            s.delete(commentId);
            return s;
          });
        }
      }
    } catch (err) {
      console.error('[Viewer] Comment like error', err);
    }
  };

  const triggerReaction = (emoji: string) => {
    const id = `r_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    setReactions((p) => [...p, { id, emoji }]);
    // optimistic local increment
    setReactionsCount((c) => c + 1);

    // send to backend
    (async () => {
      try {
        await fetch(`/api/posts/${post.id}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emoji }),
        });
      } catch (err) {
        console.error('Reaction API error', err);
        // rollback optimistic increment
        setReactionsCount((c) => Math.max(0, c - 1));
      }
    })();

    // remove after animation
    setTimeout(() => {
      setReactions((p) => p.filter((r) => r.id !== id));
    }, 1400);
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.22 } },
    exit: { opacity: 0, transition: { duration: 0.18 } },
  };

  const mediaVariants = {
    enter: { opacity: 0, scale: 0.985 },
    center: { opacity: 1, scale: 1, transition: { duration: 0.28 } },
    exit: { opacity: 0, scale: 0.99, transition: { duration: 0.2 } },
  };

  const panelVariants = {
    hidden: { x: 120, opacity: 0 },
    visible: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { x: 120, opacity: 0, transition: { duration: 0.18 } },
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-black/95 flex flex-col overflow-hidden"
        variants={overlayVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Global Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <Header onMenuClick={() => {}} />
        </div>

        {/* Viewer Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          <button onClick={onClose} className="fixed top-4 right-4 z-[10000] text-white p-2 bg-black/30 rounded-full hover:scale-105 transition-transform">
            <X size={28} />
          </button>

          {/* Left: Media */}
          <div className="flex-1 md:w-2/3 flex items-center justify-center relative p-4 h-[50vh] md:h-auto">
            <div className="w-full h-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div key={`media-${index}`} variants={mediaVariants} initial="enter" animate="center" exit="exit" className="max-w-full max-h-[85vh] md:max-h-[80vh]">
                  {current.type === 'image' ? (
                    <motion.img src={current.url} alt={`media-${index}`} className="max-w-full max-h-[85vh] md:max-h-[80vh] object-contain drop-shadow-lg rounded" />
                  ) : (
                    <motion.video src={current.url} controls className="max-w-full max-h-[85vh] md:max-h-[80vh] object-contain drop-shadow-lg rounded" />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {allMedia.length > 1 && (
              <>
                <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <ChevronLeft size={28} />
                </button>
                <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 text-white p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
                  <ChevronRight size={28} />
                </button>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white bg-black/60 px-3 py-1 rounded-full text-sm">{index + 1} / {allMedia.length}</div>
              </>
            )}
          </div>

          {/* Right: Panel */}
          <motion.aside className="w-full md:w-1/3 bg-white dark:bg-gray-900 flex flex-col border-l border-gray-200 h-[calc(100vh-4rem)] md:h-auto z-[10001]" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
            {/* Author Header */}
            <div className="flex items-center gap-3 p-4 border-b">
              <Avatar src={post?.user?.avatar || post?.author?.avatar || null} name={post?.user?.name || post?.author?.name || 'User'} userId={post?.user?.id || post?.author?.id} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm">{post?.user?.username || post?.author?.username || '@user'}</div>
                <div className="font-bold text-sm">{post?.user?.name || post?.author?.name || 'User'}</div>
                <div className="text-xs text-gray-500">{new Date(post?.createdAt || post?.timestamp || Date.now()).toLocaleString()}</div>
              </div>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMoreMenu((s) => !s); }}
                  aria-expanded={showMoreMenu}
                  className="p-2 hover:bg-gray-100 rounded-full"
                  title="Options"
                >
                  <MoreHorizontal size={18} />
                </button>

                {showMoreMenu && (
                  <div ref={moreMenuRef} onClick={(e) => e.stopPropagation()} className="absolute right-0 mt-2 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-50 ring-1 ring-black/5">
                    <div className="flex flex-col py-1">
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            if (navigator.share) {
                              await navigator.share({ title: document.title, url: `${window.location.origin}/posts/${post.id}` });
                            } else {
                              await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
                              alert('Lien copié dans le presse-papiers');
                            }
                          } catch (err) {
                            console.warn('Share failed', err);
                          }
                          setShowMoreMenu(false);
                        }}
                        className="text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Partager
                      </button>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
                            alert('Lien copié dans le presse-papiers');
                          } catch (err) {
                            console.warn('Copy link failed', err);
                          }
                          setShowMoreMenu(false);
                        }}
                        className="text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        Copier le lien
                      </button>

                      {session?.user?.id === (post?.user?.id || post?.author?.id) ? (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (confirm('Supprimer cette publication ?')) {
                              onDelete?.(post.id);
                            }
                            setShowMoreMenu(false);
                          }}
                          className="text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          Supprimer
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // navigate to report flow
                            try { router.push(`/posts/${post.id}?report=1`); } catch (err) { window.location.href = `/posts/${post.id}?report=1`; }
                            setShowMoreMenu(false);
                          }}
                          className="text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          Signaler
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content + Stats */}
            <div className="px-4 py-3 border-b">
              {post?.content && <p className="text-sm text-gray-800">{post.content}</p>}
              <div className="mt-3 text-xs text-gray-500">{post._count?.likes || 0} j'aime • {post._count?.comments || 0} commentaires</div>
            </div>

            {/* Action Buttons */}
            <div className="px-4 py-2 border-b flex items-center gap-2 flex-wrap">
              <button onClick={handleLike} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-colors ${liked ? 'bg-accent text-black' : 'bg-gray-100 hover:bg-gray-200'}`}>
                <Heart size={16} /> <span className="text-sm">J'aime</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                <MessageCircle size={16} /> <span className="text-sm">Commenter</span>
              </button>
              <button className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                <Share2 size={16} /> <span className="text-sm">Partager</span>
              </button>
            </div>

            {/* Reaction Picker Card */}
            <div className="px-4 py-2 border-b relative">
              <div className="flex items-center gap-2">
                {['👍', '❤️', '😂', '😮', '😢', '😡'].map((e) => (
                  <button key={e} onClick={() => triggerReaction(e)} className="p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-lg transition-colors" title={`React ${e}`}>{e}</button>
                ))}
              </div>
            </div>

            {/* Comments Section */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
              {comments && comments.length > 0 ? (
                comments.map((c) => (
                  <div key={c.id} className="space-y-2">
                    {/* Main Comment */}
                    <div className="flex items-start gap-3">
                      <Avatar src={c.user?.avatar || null} name={c.user?.fullName || c.user?.name || 'U'} userId={c.user?.id} size="sm" />
                      <div className="flex-1">
                        <div className="bg-gray-100 rounded-lg px-3 py-2 border-l-4 border-primary">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm">{c.user?.fullName || c.user?.name}</span>
                            <span className="text-xs text-gray-500">@{c.user?.username}</span>
                          </div>
                          <div className="text-sm text-gray-700">{c.content || c.text}</div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 pl-12">
                          <button onClick={() => handleCommentLike(c.id)} className={`text-xs font-semibold transition-colors ${likedComments.has(c.id) ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}>J'aime</button>
                          <button onClick={() => setReplyToCommentId(c.id)} className="text-xs text-gray-500 hover:text-gray-700 font-semibold">Répondre</button>
                          <span className="text-xs text-gray-400">{new Date(c.createdAt || Date.now()).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>

                    {/* Nested Replies */}
                    {Array.isArray(c.replies) && c.replies.length > 0 && (
                      <div className="ml-12 space-y-2 border-l-2 border-gray-200 pl-3">
                        {c.replies.map((reply: any) => (
                          <div key={reply.id} className="flex items-start gap-2">
                            <Avatar src={reply.user?.avatar || null} name={reply.user?.fullName || reply.user?.name || 'U'} userId={reply.user?.id} size="sm" />
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-xs">{reply.user?.fullName || reply.user?.name}</span>
                                  <span className="text-xs text-gray-500">@{reply.user?.username}</span>
                                </div>
                                <div className="text-xs text-gray-700">{reply.content || reply.text}</div>
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 pl-0">
                                <button onClick={() => handleCommentLike(reply.id)} className={`text-xs font-semibold transition-colors ${likedComments.has(reply.id) ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}>J'aime</button>
                                <button onClick={() => setReplyToCommentId(c.id)} className="text-xs text-gray-500 hover:text-gray-700 font-semibold">Répondre</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply Input */}
                    {replyToCommentId === c.id && (
                      <div className="ml-12 flex items-center gap-2 mt-2">
                        <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Écrire une réponse..." className="flex-1 px-3 py-1 text-sm rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary" />
                        <button onClick={async () => {
                          if (!replyText.trim()) return;
                          try {
                            console.debug('[Viewer] Sending reply to comment', c.id, 'with parentId');
                            const res = await fetch(`/api/posts/${post.id}/comments`, {
                              method: 'POST', 
                              headers: { 'Content-Type': 'application/json' }, 
                              body: JSON.stringify({ content: replyText, parentId: c.id })
                            });
                            console.debug('[Viewer] Reply response status:', res.status);
                            if (res.ok) {
                              const reply = await res.json();
                              console.debug('[Viewer] Reply created:', reply);
                              setComments((prev) => prev.map(com => com.id === c.id ? { ...com, replies: [...(com.replies || []), reply] } : com));
                              setReplyText('');
                              setReplyToCommentId(null);
                            } else {
                              const err = await res.json();
                              console.error('[Viewer] Reply error:', err);
                            }
                          } catch (err) { console.error('[Viewer] Reply error', err); }
                        }} className="text-sm bg-primary text-white px-3 py-1 rounded-full">Envoyer</button>
                        <button onClick={() => { setReplyToCommentId(null); setReplyText(''); }} className="text-sm text-gray-500">✕</button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-sm text-gray-500 text-center py-4">Aucun commentaire</div>
              )}
            </div>

            {/* Comment Input */}
            <div className="px-4 py-3 border-t">
              <div className="flex items-center gap-2">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Écrire un commentaire..." className="flex-1 px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                <button onClick={async () => {
                  if (!commentText.trim()) return;
                  try {
                    console.debug('[Viewer] Posting comment to post', post.id, ':', commentText);
                    setCommentLoading(true);
                    const res = await fetch(`/api/posts/${post.id}/comments`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ content: commentText })
                    });
                    console.debug('[Viewer] Comment response status:', res.status);
                    if (res.ok) {
                      setCommentText('');
                      const d = await res.json();
                      console.debug('[Viewer] Comment created:', d);
                      setComments((p) => [...p, d]);
                    } else {
                      const err = await res.json();
                      console.error('[Viewer] Comment error:', err);
                    }
                  } catch (err) { console.error('[Viewer] Comment post error', err); }
                  finally { setCommentLoading(false); }
                }} className="bg-primary text-white px-4 py-2 rounded-full text-sm">{commentLoading ? '...' : 'Envoyer'}</button>
              </div>
            </div>
          </motion.aside>
        </div>

        {/* Reaction animations overlay */}
        <div className="pointer-events-none absolute inset-0 flex items-end justify-center">
          <div className="relative w-full h-48 flex items-end justify-center">
            <AnimatePresence>
              {reactions.map((r) => (
                <motion.span
                  key={r.id}
                  initial={{ y: 0, opacity: 1, scale: 1 }}
                  animate={{ y: -140, opacity: 0, scale: 1.2 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  className="absolute text-3xl"
                >
                  {r.emoji}
                </motion.span>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
