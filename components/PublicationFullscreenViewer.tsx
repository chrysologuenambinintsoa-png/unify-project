'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Heart, MessageCircle, Share2, Bookmark, MoreVertical, 
  ChevronLeft, ChevronRight, Send, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { optimizeAvatarUrl, optimizeImageUrl } from '@/lib/cloudinaryOptimizer';

interface PublicationFullscreenViewerProps {
  post: any;
  initialImageIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export function PublicationFullscreenViewer({
  post,
  initialImageIndex = 0,
  isOpen,
  onClose,
  onLike,
  onDelete,
}: PublicationFullscreenViewerProps) {
  const [currentMediaIndex, setCurrentMediaIndex] = useState(initialImageIndex);
  const [liked, setLiked] = useState(!!post.liked);
  const [likeCount, setLikeCount] = useState<number>(
    Array.isArray(post.likes)
      ? post.likes.length
      : typeof post.likes === 'number'
      ? post.likes
      : post._count?.likes ?? 0
  );
  const [commentCount, setCommentCount] = useState<number>(
    Array.isArray(post.comments)
      ? post.comments.length
      : typeof post.comments === 'number'
      ? post.comments
      : post._count?.comments ?? 0
  );
  const [shareCount, setShareCount] = useState<number>(
    typeof post.shares === 'number' ? post.shares : 0
  );
  const [saved, setSaved] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>(
    Array.isArray(post.comments) ? post.comments : []
  );
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Media arrays
  const images: string[] = post?.images ?? 
    (post?.media ? post.media.filter((m: any) => m.type === 'image').map((m: any) => m.url) : []);
  const videos: string[] = post?.videos ?? 
    (post?.media ? post.media.filter((m: any) => m.type === 'video').map((m: any) => m.url) : []);
  const allMedia: Array<{ type: 'image' | 'video'; url: string }> = [
    ...images.map(url => ({ type: 'image' as const, url })),
    ...videos.map(url => ({ type: 'video' as const, url }))
  ];

  const commentInputRef = useRef<HTMLTextAreaElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Extract author
  let author = post?.user || post?.author || post?.authorData || post?.owner;
  if (!author) {
    author = { id: '', name: 'Unknown User', avatar: null, username: 'unknown', fullName: 'Unknown User' };
  }

  author = {
    id: author.id || '',
    name: author.name || author.fullName || 'Unknown User',
    avatar: author.avatar || null,
    username: author.username || 'unknown',
  };
  
  // Determine cover image (author or post) to display behind header if available
  const coverUrl = author?.cover || author?.coverImage || post?.coverImage || post?.cover || null;

  const createdAt = post?.createdAt ?? post?.created_at ?? new Date();

  // Helpers
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { 
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ' à ' + d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLike = async () => {
    if (!liked) {
      setLiked(true);
      setLikeCount(prev => prev + 1);
      onLike?.(post.id);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    
    // Simulate adding comment
    setTimeout(() => {
      const newComment = {
        id: Date.now().toString(),
        user: {
          id: 'current-user',
          name: 'You',
          username: 'you',
          avatar: null,
          fullName: 'You'
        },
        content: commentText,
        createdAt: new Date(),
        likes: 0
      };
      
      setComments(prev => [newComment, ...prev]);
      setCommentCount(prev => prev + 1);
      setCommentText('');
      setIsSubmittingComment(false);
    }, 500);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    if (touchStartX.current && touchEndX.current) {
      const diff = touchStartX.current - touchEndX.current;
      if (diff > 50) {
        handleNextMedia();
      } else if (diff < -50) {
        handlePrevMedia();
      }
    }
  };

  const handleNextMedia = () => {
    setCurrentMediaIndex(prev => 
      prev < allMedia.length - 1 ? prev + 1 : 0
    );
  };

  const handlePrevMedia = () => {
    setCurrentMediaIndex(prev => 
      prev > 0 ? prev - 1 : allMedia.length - 1
    );
  };

  if (!isOpen) return null;

  const currentMedia = allMedia[currentMediaIndex];

  return (
    <AnimatePresence>
      <motion.div
        key="publication-fullscreen-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black"
      >
        {/* Close Button - Top Right */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 text-white hover:bg-white/10 p-2 rounded-full transition-colors"
        >
          <X size={28} />
        </button>

        {/* Main Container */}
        <div className="h-screen flex flex-col md:flex-row">
          {/* Media Section - Left/Top */}
          <div className="flex-1 flex flex-col items-center justify-center relative bg-black order-1 md:order-1 min-h-96 md:min-h-screen">
            {/* Media Display */}
            <div
              className="w-full h-full flex items-center justify-center relative overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Desktop overlay: enhanced author profile header (md+) with cover */}
              {coverUrl && (
                <div className="hidden md:block absolute top-0 left-0 right-0 h-36 z-0 overflow-hidden">
                  <img
                    src={optimizeImageUrl(coverUrl, 1600, 400) || coverUrl}
                    alt="Cover"
                    className="w-full h-full object-cover opacity-90"
                  />
                </div>
              )}
              <div className="hidden md:flex absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-black/40 backdrop-blur-md px-4 py-3 items-center gap-4">
                <Link
                  href={author?.id ? `/users/${author.id}/profile` : '#'}
                  className="flex items-center gap-3 min-w-0 no-underline cursor-pointer"
                  aria-label={`Voir le profil de ${author?.name}`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden ring-2 ring-white/20 flex-shrink-0">
                    <Avatar src={optimizeAvatarUrl(author?.avatar, 80) || author?.avatar} name={author?.name} size="sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-white text-sm md:text-base leading-tight truncate">{author?.name}</p>
                    <p className="text-xs text-gray-200/90 leading-snug truncate">@{author?.username} • {formatDate(createdAt)}</p>
                  </div>
                </Link>
                <div className="ml-auto flex items-center gap-4">
                  <div className="text-sm text-gray-200/95 font-medium">{likeCount} <span className="text-gray-300 text-xs">j'aime</span></div>
                  <div className="text-sm text-gray-200/95 font-medium">{commentCount} <span className="text-gray-300 text-xs">commentaires</span></div>
                  <button
                    onClick={onClose}
                    className="ml-2 px-3 py-1 rounded bg-white/10 text-white text-sm hover:bg-white/20 transition-colors"
                  >
                    Fermer
                  </button>
                </div>
              </div>

              {currentMedia ? (
                <>
                  {currentMedia.type === 'image' ? (
                    <img
                      key={currentMedia.url}
                      src={currentMedia.url}
                      alt="Post media"
                      className="max-w-full max-h-full object-contain w-full h-full"
                    />
                  ) : (
                    <video
                      key={currentMedia.url}
                      src={currentMedia.url}
                      controls
                      className="max-w-full max-h-full object-contain w-full h-full"
                    />
                  )}

                  {/* Image Navigation - Desktop visible */}
                  {allMedia.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevMedia}
                        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                      >
                        <ChevronLeft size={32} />
                      </button>
                      <button
                        onClick={handleNextMedia}
                        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 p-2 rounded-full transition-colors"
                      >
                        <ChevronRight size={32} />
                      </button>

                      {/* Media Counter */}
                      <div className="absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                        {currentMediaIndex + 1} / {allMedia.length}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-white text-center">
                  <MessageCircle size={48} className="mx-auto mb-4" />
                  <p>No media available</p>
                </div>
              )}
            </div>
          </div>

          {/* Details Section - Right/Bottom */}
          <div className="w-full md:w-[450px] bg-white dark:bg-gray-900 flex flex-col order-2 md:order-2 max-h-[45vh] md:max-h-full overflow-hidden">
            {/* Header - User Info */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar 
                    src={optimizeAvatarUrl(author?.avatar, 160) || author?.avatar} 
                    name={author?.name} 
                    size="md"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 dark:text-white truncate">
                      {author?.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      @{author?.username}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMoreMenu(!showMoreMenu)}
                    className="text-gray-600 dark:text-gray-400 hover:text-primary p-1"
                    aria-label="Plus d'options"
                  >
                    <MoreHorizontal size={20} />
                  </button>
                  <button
                    onClick={onClose}
                    className="text-gray-600 dark:text-gray-300 hover:text-red-600 p-1"
                    aria-label="Fermer le viewer"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Date */}
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {formatDate(createdAt)}
              </p>

              {/* More Menu */}
              {showMoreMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg mt-2 border border-gray-200 dark:border-gray-700 z-10"
                >
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                    Signaler
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => {
                        onDelete(post.id);
                        onClose();
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Supprimer
                    </button>
                  )}
                </motion.div>
              )}
            </div>

            {/* Caption */}
            {post.content && (
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-3">
                  {post.content}
                </p>
              </div>
            )}

            {/* Engagement Stats */}
            <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between text-xs text-gray-600 dark:text-gray-400 flex-shrink-0">
              <span>{likeCount} j'aime</span>
              <div className="flex space-x-3">
                <span>{commentCount} commentaires</span>
                <span className="hidden sm:inline">{shareCount} partages</span>
              </div>
            </div>

            {/* Action Buttons moved to bottom of comments cage for better UX */}

            {/* Comments Section */}
            <div className="flex-1 overflow-y-auto flex flex-col">
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar
                        src={comment.user?.avatar}
                        name={comment.user?.name}
                        size="sm"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                          <p className="font-semibold text-sm text-gray-900 dark:text-white">
                            {comment.user?.name}
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                            {comment.content}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-2">
                          il y a quelques secondes
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <MessageCircle size={32} className="mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Aucun commentaire pour le moment
                    </p>
                  </div>
                )}
              </div>

                {/* Action Buttons - moved to bottom of the comments cage */}
                <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2 bg-white dark:bg-gray-900">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleLike}
                      className={`flex items-center gap-2 px-3 py-2 rounded ${
                        liked
                          ? 'text-red-500 bg-red-50 dark:bg-red-900/20'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Heart size={18} className={liked ? 'fill-current' : ''} />
                      <span className="text-sm hidden sm:inline">J'aime</span>
                    </button>

                    <button
                      onClick={() => {
                        setShowComments(true);
                        setTimeout(() => commentInputRef.current?.focus(), 50);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <MessageCircle size={18} />
                      <span className="text-sm hidden sm:inline">Commenter</span>
                    </button>

                    <button
                      onClick={() => setShowShareModal(true)}
                      className="flex items-center gap-2 px-3 py-2 rounded text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      <Share2 size={18} />
                      <span className="text-sm hidden sm:inline">Partager</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setSaved(!saved)}
                    className={`flex items-center gap-2 px-3 py-2 rounded ${
                      saved
                        ? 'text-primary bg-blue-50 dark:bg-blue-900/20'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <Bookmark size={18} className={saved ? 'fill-current' : ''} />
                    <span className="text-sm hidden sm:inline">Enregistrer</span>
                  </button>
                </div>

                {/* Comment Input */}
              <div className="border-t border-gray-200 dark:border-gray-700 p-3 flex-shrink-0">
                <form onSubmit={handleCommentSubmit} className="space-y-2">
                  <textarea
                    ref={commentInputRef}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Rédigez un commentaire..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                    rows={2}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!commentText.trim() || isSubmittingComment}
                      className="flex items-center gap-2 px-3 py-1.5 bg-[#0D2E5F] hover:bg-[#0A2342] text-white rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={16} />
                      <span className="hidden sm:inline">Envoyer</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
