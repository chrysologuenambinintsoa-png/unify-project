'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Heart, MessageCircle, Share2, Bookmark, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { HeartIcon } from '@/components/HeartIcon';
import ShareModal from '@/components/post/ShareModal';

interface PostImageViewerProps {
  post: any;
  initialImageIndex?: number;
  isOpen: boolean;
  onClose: () => void;
  onLike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
}

export function PostImageViewer({
  post,
  initialImageIndex = 0,
  isOpen,
  onClose,
  onLike,
  onDelete,
}: PostImageViewerProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
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
  const [shareCount, setShareCount] = useState<number>(typeof post.shares === 'number' ? post.shares : 0);
  const [saved, setSaved] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  // media arrays (images/videos) derived from post
  const images: string[] = post?.images ?? (post?.media ? post.media.filter((m: any) => m.type === 'image').map((m: any) => m.url) : []);
  const videos: string[] = post?.videos ?? (post?.media ? post.media.filter((m: any) => m.type === 'video').map((m: any) => m.url) : []);
  const allMedia: Array<{ type: 'image' | 'video'; url: string }> = [
    ...images.map(url => ({ type: 'image' as const, url })),
    ...videos.map(url => ({ type: 'video' as const, url }))
  ];

  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  // Touch swipe refs (declare unconditionally to preserve Hooks order)
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);

  // Keep currentImageIndex within bounds when media list changes
  useEffect(() => {
    if (currentImageIndex >= allMedia.length) setCurrentImageIndex(0);
  }, [allMedia.length, currentImageIndex]);
  
  // Extract author - the API returns it as 'user', not 'author'
  let author = post?.user;
  if (!author) {
    author = post?.author;
  }
  if (!author) {
    author = post?.authorData;
  }
  if (!author) {
    author = post?.owner;
  }
  if (!author) {
    author = { id: '', name: 'Unknown User', avatar: null, username: 'unknown', fullName: 'Unknown User' };
  }

  // Ensure author has all required fields
  author = {
    id: author.id || '',
    name: author.name || author.fullName || 'Unknown User',
    avatar: author.avatar || null,
    username: author.username || 'unknown',
  };

  const createdAt = post?.createdAt ?? post?.created_at ?? new Date();

  // Debug logging
  useEffect(() => {
    console.log('=== PostImageViewer Debug ===');
    console.log('Full Post:', JSON.stringify(post, null, 2));
    console.log('Author object:', author);
    console.log('Author.name:', author?.name);
    console.log('Author.avatar:', author?.avatar);
    console.log('Author.username:', author?.username);
    console.log('Images:', images);
  }, [post, author, images]);

  const handleLike = async () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    if (onLike) {
      onLike(post.id);
    }
  };

  const handleSave = () => {
    setSaved(!saved);
  };

  const goToPrevious = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const d = date ? new Date(date) : now;
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });

      if (response.ok) {
        setCommentText('');
        setCommentCount(prev => prev + 1);
        if (commentInputRef.current) {
          commentInputRef.current.focus();
        }
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (!isOpen || !post || allMedia.length === 0) return null;

  const currentMedia = allMedia[currentImageIndex];

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) {
      touchStartX.current = null;
      touchEndX.current = null;
      return;
    }
    const dx = touchEndX.current - touchStartX.current;
    const threshold = 50; // px
    if (Math.abs(dx) > threshold) {
      if (dx < 0) goToNext();
      else goToPrevious();
    }
    touchStartX.current = null;
    touchEndX.current = null;
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex overflow-hidden pt-0">
      {/* Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 z-60 text-white hover:text-gray-300 transition-colors duration-200"
      >
        <X size={32} />
      </button>

      {/* Left side - Image viewer */}
      <div className="flex-1 flex items-center justify-center relative">
        {/* Image */}
        <div
          className="relative w-full h-screen flex items-center justify-center px-8"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {currentMedia.type === 'image' ? (
            <img
              src={currentMedia.url}
              alt={`Post media ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <video
              src={currentMedia.url}
              controls
              className="max-w-full max-h-full object-contain"
            />
          )}

          {/* Navigation Arrows + Dots */}
          {allMedia.length > 1 && (
            <>
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 text-white transition-colors duration-200"
                aria-label="Previous media"
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2 text-white transition-colors duration-200"
                aria-label="Next media"
              >
                <ChevronRight size={28} />
              </button>

              {/* Image Counter */}
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                {currentImageIndex + 1} / {allMedia.length}
              </div>

              {/* Dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2">
                {allMedia.map((m, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentImageIndex(idx)}
                    className={`w-2 h-2 rounded-full transition-colors ${idx === currentImageIndex ? 'bg-white' : 'bg-white/40'}`}
                    aria-label={`Go to media ${idx + 1}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right side - Post details panel */}
      <div className="w-[420px] bg-white flex flex-col h-screen overflow-hidden">
        {/* Header with author info */}
        <div className="p-4 border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* User Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm overflow-hidden flex-shrink-0">
                {author?.avatar && !avatarError ? (
                  <img
                    src={author.avatar}
                    alt={author?.name || 'User'}
                    className="w-full h-full object-cover"
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <span>{(author?.name || 'U').charAt(0).toUpperCase()}</span>
                )}
              </div>
              {/* User Info */}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 text-sm truncate">{author?.name || 'Unknown User'}</p>
                <p className="text-xs text-gray-500 truncate">@{author?.username || 'username'}</p>
              </div>
            </div>
            <button className="text-gray-500 hover:text-gray-700 flex-shrink-0">
              <MoreVertical size={18} />
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">{formatDate(createdAt)}</p>
        </div>

        {/* Post content */}
        {post.content && (
          <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
            <p className="text-sm text-gray-900">{post.content}</p>
          </div>
        )}

        {/* Engagement Stats */}
        <div className="px-4 py-3 border-b border-gray-200 text-xs text-gray-600 flex justify-between flex-shrink-0">
          <span>{likeCount} likes</span>
          <div className="flex space-x-4">
            <span>{commentCount} comments</span>
            <span>{shareCount} shares</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 py-3 border-b border-gray-200 flex gap-2 flex-shrink-0">
          <button
            onClick={handleLike}
            className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-lg font-medium text-sm transition-colors duration-200 ${
              liked
                ? 'text-red-500 bg-red-50'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Heart size={16} className={liked ? 'fill-current' : ''} />
            <span>Like</span>
          </button>

          <button className="flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-200 text-sm">
            <MessageCircle size={16} />
            <span>Comment</span>
          </button>

          <button
            onClick={() => setShowShareModal(true)}
            className="flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-200 text-sm"
          >
            <Share2 size={16} />
            <span>Share</span>
          </button>

          <button
            onClick={handleSave}
            className={`flex-1 flex items-center justify-center gap-2 px-2 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
              saved
                ? 'text-primary bg-primary/10'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Bookmark size={16} className={saved ? 'fill-current' : ''} />
            <span>Save</span>
          </button>
        </div>

        {/* Comments section (scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
          <div className="space-y-3">
            {/* Placeholder for existing comments */}
            <div className="text-xs text-gray-500 text-center py-8">
              Comments will appear here
            </div>
          </div>
        </div>

        {/* Comment input */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0">
          <form onSubmit={handleCommentSubmit} className="space-y-2">
            <textarea
              ref={commentInputRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={2}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmittingComment}
              className="w-full px-3 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmittingComment ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        postId={post.id}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={async (shareType, recipientId, message) => {
          try {
            const response = await fetch(`/api/posts/${post.id}/share`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                shareType,
                recipientId: shareType === 'message' ? recipientId : undefined,
                groupId: shareType === 'group' ? recipientId : undefined,
                message,
              }),
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to share post');
            }

            setShareCount(prev => prev + 1);
          } catch (err) {
            console.error('Share error:', err);
            throw err;
          }
        }}
        postContent={post.content}
      />
    </div>
  );
}
