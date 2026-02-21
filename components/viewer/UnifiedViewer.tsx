"use client";

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X, Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Flag, Trash2, Copy, Share } from 'lucide-react';
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
  const [likeCount, setLikeCount] = useState<number>(post?._count?.likes ?? 0);
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);

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

  // Close emoji picker on outside click or Escape
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!emojiPickerRef.current) return;
      const target = e.target as Node;
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(target)) {
        setShowEmojiPicker(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowEmojiPicker(false);
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
        const res = await fetch(`/api/posts/${post.id}/comments`, { credentials: 'include' });
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
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    if (newLiked) {
      onLike?.(post.id);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    console.debug('[Viewer] Comment like clicked:', commentId);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments/${commentId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
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
      } else {
        const text = await res.text();
        console.error('[Viewer] Comment like failed', res.status, text);
      }
    } catch (err) {
      console.error('[Viewer] Comment like error', err);
    }
  };

  const handleCommentReaction = async (commentId: string, emoji: string) => {
    console.debug('[Viewer] Comment reaction:', commentId, emoji);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments/${commentId}/reaction`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ emoji }),
      });
      if (res.ok) {
        console.debug('[Viewer] Comment reaction posted successfully');
      } else {
        const text = await res.text();
        console.error('[Viewer] Comment reaction failed', res.status, text);
      }
    } catch (err) {
      console.error('[Viewer] Comment reaction error', err);
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
        {/* Close Button - Desktop only */}
        <button 
          onClick={onClose} 
          className="hidden md:flex fixed top-6 right-6 z-[10002] text-white p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all hover:scale-110"
          aria-label="Close viewer"
        >
          <X size={28} />
        </button>

        {/* Global Header */}
        <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 hidden md:block">
          <Header onMenuClick={() => {}} />
        </div>

        {/* Viewer Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">

          {/* Left: Media */}
          <div className="flex-1 md:w-2/3 flex items-center justify-center relative p-2 md:p-4 h-[40vh] md:h-auto">
            <div className="w-full h-full flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div key={`media-${index}`} variants={mediaVariants} initial="enter" animate="center" exit="exit" className="max-w-full max-h-full">
                  {current.type === 'image' ? (
                    <motion.img src={current.url} alt={`media-${index}`} className="max-w-full max-h-full object-contain drop-shadow-lg rounded" />
                  ) : (
                    <motion.video src={current.url} controls className="max-w-full max-h-full object-contain drop-shadow-lg rounded" />
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

          {/* Right: Panel - Mobile bottom, Desktop right */}
          <motion.aside className="w-full md:w-1/3 bg-white dark:bg-gray-900 flex flex-col border-t md:border-t-0 md:border-l border-gray-200 h-1/2 md:h-auto z-[10001] order-last md:order-none" variants={panelVariants} initial="hidden" animate="visible" exit="exit">
            {/* Author Header */}
            <div className="flex items-center gap-2 md:gap-3 p-3 md:p-4 border-b">
              {/* Mobile Close Button */}
              <button 
                onClick={onClose} 
                className="md:hidden text-gray-500 hover:text-gray-700 p-1 flex-shrink-0"
                aria-label="Close viewer"
              >
                <X size={20} />
              </button>
              <Avatar src={post?.user?.avatar || post?.author?.avatar || null} name={post?.user?.fullName || post?.author?.fullName || post?.user?.name || post?.author?.name || 'User'} userId={post?.user?.id || post?.author?.id} size="sm" className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-xs md:text-sm">{post?.user?.username || post?.author?.username || '@user'}</div>
                <div className="font-bold text-xs md:text-sm">{post?.user?.fullName || post?.author?.fullName || post?.user?.name || post?.author?.name || 'User'}</div>
                      <div className="text-xs text-gray-500 hidden md:block">{new Date(post?.createdAt || post?.timestamp || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
              </div>
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMoreMenu((s) => !s); }}
                  aria-expanded={showMoreMenu}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                  title="Options"
                >
                  <MoreHorizontal size={18} />
                </button>

                {showMoreMenu && (
                  <div ref={moreMenuRef} onClick={(e) => e.stopPropagation()} className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50 ring-1 ring-black/5 overflow-hidden">
                    <div className="flex flex-col py-1">
                      {/* Share Section */}
                      <button
                        onClick={async (e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            if (navigator.share) {
                              await navigator.share({ title: document.title, url: `${window.location.origin}/posts/${post.id}` });
                            } else {
                              await navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 2000);
                            }
                          } catch (err) {
                            console.warn('Share failed', err);
                          }
                          setShowMoreMenu(false);
                        }}
                        className="text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <Share size={16} />
                        <span className="font-medium">Partager</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          try {
                            navigator.clipboard.writeText(`${window.location.origin}/posts/${post.id}`);
                            setCopied(true);
                            setTimeout(() => setCopied(false), 2000);
                          } catch (err) {
                            console.warn('Copy link failed', err);
                          }
                          setShowMoreMenu(false);
                        }}
                        className="text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-gray-700 dark:text-gray-300"
                      >
                        <Copy size={16} />
                        <span className="font-medium">{copied ? 'Copié ✓' : 'Copier le lien'}</span>
                      </button>

                      {/* Divider */}
                      <div className="h-px bg-gray-200 dark:bg-gray-700 my-1" />

                      {session?.user?.id === (post?.user?.id || post?.author?.id) ? (
                        <>
                          {/* Edit Option (future) */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              // Navigate to edit or open edit modal
                              console.log('Edit post:', post.id);
                              setShowMoreMenu(false);
                            }}
                            className="text-left px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-3 text-gray-700 dark:text-gray-300"
                          >
                            <MessageCircle size={16} />
                            <span className="font-medium">Éditer</span>
                          </button>

                          {/* Delete Option */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              const confirmed = confirm('Êtes-vous sûr de vouloir supprimer cette publication ?');
                              if (confirmed) {
                                (async () => {
                                  try {
                                    const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' });
                                    if (res.ok) {
                                      onDelete?.(post.id);
                                      onClose?.();
                                    } else {
                                      alert('Erreur lors de la suppression');
                                    }
                                  } catch (err) {
                                    console.error('Delete error:', err);
                                    alert('Erreur lors de la suppression');
                                  }
                                })();
                              }
                              setShowMoreMenu(false);
                            }}
                            className="text-left px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center gap-3 text-red-600 dark:text-red-400"
                          >
                            <Trash2 size={16} />
                            <span className="font-medium">Supprimer</span>
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Report Option */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              try {
                                router.push(`/posts/${post.id}?report=1`);
                              } catch (err) {
                                window.location.href = `/posts/${post.id}?report=1`;
                              }
                              setShowMoreMenu(false);
                            }}
                            className="text-left px-4 py-2.5 text-sm hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors flex items-center gap-3 text-orange-600 dark:text-orange-400"
                          >
                            <Flag size={16} />
                            <span className="font-medium">Signaler</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content + Stats */}
            <div className="px-3 md:px-4 py-2 md:py-3 border-b">
              {post?.content && <p className="text-xs md:text-sm text-gray-800">{post.content}</p>}
              <div className="mt-2 md:mt-3 text-xs text-gray-500">{likeCount || post._count?.likes || 0} j'aime • {post._count?.comments || 0} commentaires</div>
            </div>

            {/* Action Buttons */}
            <div className="px-2 md:px-4 py-2 md:py-3 border-b">
              <div className="grid grid-cols-4 gap-1 md:gap-2">
                <button 
                  type="button"
                  onClick={handleLike} 
                  className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-0.5 md:gap-2 px-1 md:px-3 py-2 rounded-lg transition-colors text-xs md:text-sm font-medium ${liked ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                  title="J'aime"
                >
                  <Heart size={18} fill={liked ? 'currentColor' : 'none'} /> <span className="hidden md:inline">J'aime</span>
                </button>
                <button 
                  type="button"
                  className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-0.5 md:gap-2 px-1 md:px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs md:text-sm font-medium"
                  title="Commenter"
                >
                  <MessageCircle size={18} /> <span className="hidden md:inline">Commenter</span>
                </button>
                <button 
                  type="button"
                  className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-0.5 md:gap-2 px-1 md:px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs md:text-sm font-medium"
                  title="Partager"
                >
                  <Share2 size={18} /> <span className="hidden md:inline">Partager</span>
                </button>
                <div className="relative flex items-stretch">
                  <button 
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`flex-1 flex flex-col md:flex-row items-center justify-center md:justify-start gap-0.5 md:gap-2 px-1 md:px-3 py-2 rounded-lg transition-colors text-xs md:text-sm font-medium ${showEmojiPicker ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                    title="Ajouter une réaction"
                  >
                    <span className="text-base md:text-lg">😊</span> <span className="hidden md:inline">Réagir</span>
                  </button>
                  
                  {/* Emoji Picker Card - Fixed positioning for mobile */}
                  {showEmojiPicker && (
                    <motion.div 
                      ref={emojiPickerRef}
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full right-0 md:right-auto md:left-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-3 z-50 w-48 md:w-56"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Ajouter une réaction</div>
                      <div className="grid grid-cols-6 gap-1">
                        {['👍', '❤️', '😂', '😮', '😢', '😡'].map((emoji) => (
                          <motion.button
                            key={emoji}
                            type="button"
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                              triggerReaction(emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
                            title={`Réagir avec ${emoji}`}
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="flex-1 overflow-y-auto px-3 md:px-4 py-2 md:py-3 space-y-2 md:space-y-4">
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
                        <div className="flex items-center gap-2 mt-1 pl-12">
                          <button type="button" onClick={() => handleCommentLike(c.id)} className={`text-xs font-semibold transition-colors ${likedComments.has(c.id) ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}>❤️ J'aime</button>
                          <div className="flex items-center gap-1">
                            {['👍', '😂', '😮', '😢', '😡'].map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleCommentReaction(c.id, emoji)}
                                title={`Réagir avec ${emoji}`}
                                className="text-sm hover:scale-125 transition-transform"
                              >
                                {emoji}
                              </button>
                            ))}
                          </div>
                          <button type="button" onClick={() => setReplyToCommentId(c.id)} className="text-xs text-gray-500 hover:text-gray-700 font-semibold">Répondre</button>
                          <span className="text-xs text-gray-400">{new Date(c.createdAt || Date.now()).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
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
                                <button type="button" onClick={() => handleCommentLike(reply.id)} className={`text-xs font-semibold transition-colors ${likedComments.has(reply.id) ? 'text-primary' : 'text-gray-500 hover:text-gray-700'}`}>❤️ J'aime</button>
                                <div className="flex items-center gap-1">
                                  {['👍', '😂', '😮', '😢', '😡'].map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => handleCommentReaction(reply.id, emoji)}
                                      title={`Réagir avec ${emoji}`}
                                      className="text-xs hover:scale-125 transition-transform"
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                                <button type="button" onClick={() => setReplyToCommentId(c.id)} className="text-xs text-gray-500 hover:text-gray-700 font-semibold">Répondre</button>
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
            <div className="px-3 md:px-4 py-2 md:py-3 border-t">
              <div className="flex items-center gap-1 md:gap-2">
                <input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Écrire un commentaire..." className="flex-1 px-3 py-2 rounded-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary text-xs md:text-sm" />
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
                }} className="bg-primary text-white px-3 md:px-4 py-2 rounded-full text-xs md:text-sm">{commentLoading ? '...' : 'Envoyer'}</button>
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
