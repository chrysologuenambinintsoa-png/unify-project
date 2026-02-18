'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Heart, MessageCircle, Share2, Bookmark, MoreVertical, 
  ChevronLeft, ChevronRight, Send, MoreHorizontal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import UnifiedViewer from '@/components/viewer/UnifiedViewer';
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

  return (
    <UnifiedViewer
      post={post}
      initialIndex={currentMediaIndex}
      isOpen={isOpen}
      onClose={onClose}
      onLike={onLike}
      onDelete={onDelete}
    />
  );
}
