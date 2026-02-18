'use client';

import React, { useState, useRef, useEffect } from 'react';
import { X, Heart, MessageCircle, Share2, Bookmark, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import { HeartIcon } from '@/components/HeartIcon';
import ShareModal from '@/components/post/ShareModal';
import UnifiedViewer from '@/components/viewer/UnifiedViewer';

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

  return (
    <UnifiedViewer
      post={post}
      initialIndex={currentImageIndex}
      isOpen={isOpen}
      onClose={onClose}
      onLike={onLike}
      onDelete={onDelete}
    />
  );
}
