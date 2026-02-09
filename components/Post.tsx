'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Share2, Bookmark, MoreVertical, X, Send, Flag } from 'lucide-react';
import { HeartIcon } from '@/components/HeartIcon';
import { useHomeActivity } from '@/contexts/HomeActivityContext';
import { useSession } from 'next-auth/react';
import ShareModal from '@/components/post/ShareModal';
import { PublicationFullscreenViewer } from '@/components/PublicationFullscreenViewer';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CommentThread } from '@/components/CommentThread';
import { optimizeAvatarUrl, optimizeImageUrl } from '@/lib/cloudinaryOptimizer';
import { Avatar } from '@/components/ui/Avatar';
import { createPortal } from 'react-dom';

interface PostProps {
  post: any;
  onEdit?: (post: any) => void;
  onDelete?: (postId: string) => void;
  onLike?: (postId: string) => void;
  onCommentAdded?: () => void | Promise<void>;
}

export default function Post({ post, onEdit, onDelete, onLike, onCommentAdded }: PostProps) {
  const { data: session } = useSession();
  const [liked, setLiked] = useState(!!post.liked);
  const { incrementHomeActivity } = useHomeActivity();
  const initialLikeCount: number = Array.isArray(post.likes)
    ? post.likes.length
    : typeof post.likes === 'number'
    ? post.likes
    : post._count?.likes ?? 0;
  const initialCommentCount: number = Array.isArray(post.comments)
    ? post.comments.length
    : typeof post.comments === 'number'
    ? post.comments
    : post._count?.comments ?? 0;
  const initialShareCount: number = typeof post.shares === 'number' ? post.shares : 0;

  const [likeCount, setLikeCount] = useState<number>(initialLikeCount);
  const [commentCount, setCommentCount] = useState<number>(initialCommentCount);
  const [shareCount, setShareCount] = useState<number>(initialShareCount);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<any[]>(Array.isArray(post.comments) ? post.comments : []);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEmojiMenu, setShowEmojiMenu] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({
    '❤️': 0,
    '😢': 0,
    '😮': 0,
    '🫂': 0,
  });
  const [reactionUsers, setReactionUsers] = useState<Record<string, Array<{id: string; name: string; avatar?: string}>>>({});
  const [selectedReactionEmoji, setSelectedReactionEmoji] = useState<string | null>(null);
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const [floatingEmoji, setFloatingEmoji] = useState<{ emoji: string; id: number } | null>(null);
  const floatingEmojiIdRef = useRef(0);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const likeButtonRef = useRef<HTMLDivElement>(null);
  const emojiMenuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const touchPressTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [emojiPortalStyle, setEmojiPortalStyle] = useState<React.CSSProperties | null>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Enhanced emoji reactions with 10 emojis and auto-animation
  const reactionEmojis = [
    { emoji: '👍', label: 'Like', color: 'from-blue-400 to-blue-500' },
    { emoji: '❤️', label: 'Love', color: 'from-red-400 to-red-500' },
    { emoji: '😂', label: 'Haha', color: 'from-yellow-400 to-yellow-500' },
    { emoji: '😮', label: 'Wow', color: 'from-orange-400 to-orange-500' },
    { emoji: '😢', label: 'Sad', color: 'from-blue-300 to-blue-400' },
    { emoji: '😡', label: 'Angry', color: 'from-red-500 to-red-600' },
    { emoji: '🔥', label: 'Fire', color: 'from-orange-500 to-red-600' },
    { emoji: '🎉', label: 'Celebrate', color: 'from-purple-400 to-pink-500' },
    { emoji: '✨', label: 'Amazing', color: 'from-yellow-300 to-purple-400' },
    { emoji: '🫂', label: 'Solidarity', color: 'from-pink-400 to-purple-500' },
  ];

  const handleEmojiReaction = (emojiData: { emoji: string; label: string }) => {
    setReactionCounts(prev => ({
      ...prev,
      [emojiData.emoji]: (prev[emojiData.emoji] || 0) + 1,
    }));
    
    // Add user to reaction users list
    if (session?.user) {
      setReactionUsers(prev => ({
        ...prev,
        [emojiData.emoji]: [
          ...(prev[emojiData.emoji] || []),
          {
            id: session.user.id,
            name: session.user.fullName || session.user.username || 'User',
            avatar: session.user.avatar,
          }
        ]
      }));
    }
    
    // Add floating emoji animation
    const newId = floatingEmojiIdRef.current++;
    setFloatingEmoji({ emoji: emojiData.emoji, id: newId });
    setTimeout(() => setFloatingEmoji(null), 1000);
    setShowEmojiMenu(false);
  };

  const handleEmojiMenuLeave = () => {
    emojiMenuTimeoutRef.current = setTimeout(() => {
      setShowEmojiMenu(false);
    }, 150);
  };

  const handleEmojiMenuEnter = () => {
    if (emojiMenuTimeoutRef.current) {
      clearTimeout(emojiMenuTimeoutRef.current);
      emojiMenuTimeoutRef.current = null;
    }
    setShowEmojiMenu(true);
  };

  // Position the emoji menu in the document body to avoid clipping by overflow:hidden parents
  useEffect(() => {
    if (!showEmojiMenu || !likeButtonRef.current) {
      setEmojiPortalStyle(null);
      return;
    }

    const updatePos = () => {
      try {
        const r = likeButtonRef.current!.getBoundingClientRect();
        const vw = window.innerWidth;
        // determine menu width based on breakpoints (approximation for tailwind w-64/w-72/w-80)
        let menuWidth = 320; // md
        if (vw < 640) menuWidth = Math.min(280, vw - 32);
        else if (vw < 768) menuWidth = 288;

        const half = Math.round(menuWidth / 2);
        let left = Math.round(r.left + r.width / 2);
        // clamp left to keep menu inside viewport with a 12px margin
        left = Math.min(Math.max(left, half + 12), vw - half - 12);

        // estimate menu height (two rows) and choose whether to place above or below
        const cell = Math.max(36, Math.round(menuWidth / 5));
        const menuHeight = cell * 2 + 32; // rows * cell + padding
        const preferredTop = Math.round(r.top - 8);
        let top = preferredTop;
        let transform = 'translate(-50%, -100%)';
        if (preferredTop - menuHeight < 8) {
          // not enough space above, place below
          top = Math.round(r.bottom + 8);
          transform = 'translate(-50%, 0)';
        }

        setEmojiPortalStyle({ position: 'fixed', left: `${left}px`, top: `${top}px`, transform, pointerEvents: 'auto', zIndex: 99999, width: `${menuWidth}px` });
      } catch (e) {}
    };

    updatePos();
    window.addEventListener('resize', updatePos);
    window.addEventListener('scroll', updatePos, { passive: true });
    return () => {
      window.removeEventListener('resize', updatePos);
      window.removeEventListener('scroll', updatePos as any);
    };
  }, [showEmojiMenu]);

  // detect touch devices (to enable long-press reaction UX)
  useEffect(() => {
    try {
      const touch = typeof window !== 'undefined' && (('ontouchstart' in window) || (window.matchMedia && window.matchMedia('(pointer:coarse)').matches));
      setIsTouchDevice(!!touch);
    } catch (e) {
      setIsTouchDevice(false);
    }
  }, []);

  const totalReactions = Object.values(reactionCounts).reduce((sum, count) => sum + count, 0);

  const handleLike = () => {
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount(prev => newLiked ? prev + 1 : Math.max(0, prev - 1));
    if (onLike) {
      onLike(post.id);
    }
    // Increment home activity badge if user is not on home page
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      incrementHomeActivity();
    }
  };

  const handleSave = () => {
    setSaved(!saved);
  };

  const handleReportPost = async () => {
    if (!reportReason.trim()) {
      alert('Please provide a reason for reporting this post');
      return;
    }

    setIsReporting(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reportReason }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to report post');
      }

      alert('Thank you for reporting this post. Our team will review it.');
      setShowReportModal(false);
      setReportReason('');
      setShowOptionsMenu(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error reporting post';
      console.error('Report error:', errorMsg);
      alert(errorMsg);
    } finally {
      setIsReporting(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmittingComment(true);
    try {
      const response = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add comment');
      }

      const newComment = await response.json();
      setComments(prev => [...prev, newComment]);
      setCommentCount(prev => prev + 1);
      setCommentText('');

      if (onCommentAdded) {
        await onCommentAdded();
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error adding comment';
      console.error('Comment error:', errorMsg);
      alert(errorMsg);
    } finally {
      setIsSubmittingComment(false);
    }
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

  // Normalize author/user and media for compatibility with different API shapes
  const author = post?.author ?? post?.user ?? { id: '', name: 'Unknown', avatar: undefined, username: undefined };
  const isPostOwner = session?.user?.id === author.id;
  const images: string[] = (post?.images ?? (post?.media ? post.media.map((m: any) => m.type !== 'video' ? m.url : null).filter(Boolean) : []))
    .filter(Boolean)
    .map((u: string) => u as string);
  const videos: string[] = post?.videos ?? (post?.media ? post.media.map((m: any) => m.type === 'video' ? m.url : null).filter(Boolean) : []);
  const createdAt = post?.createdAt ?? post?.created_at ?? new Date();

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg md:rounded-lg shadow-sm mb-4 hover:shadow-md w-full">
      {/* Post Header */}
      <div className="p-3 md:p-4 flex items-center justify-between gap-2">
        <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
          {/* User Avatar */}
          <Avatar src={optimizeAvatarUrl(author.avatar, 80) || author.avatar || null} name={author.name} size="md" className="w-10 h-10 flex-shrink-0" />
          {/* User Info */}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 dark:text-white text-sm md:text-base truncate">{author.name}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">@{author.username || 'username'} • {formatDate(createdAt)}</p>
              {(post?.isSponsored || post?.sponsored) && (
                <span className="sponsored-text">
                  📢 Sponsorisé
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Options Menu */}
        <div className="relative flex-shrink-0" ref={optionsMenuRef}>
          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
          >
            <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
          </button>

          {showOptionsMenu && (
            <div className="absolute right-0 mt-2 w-40 sm:w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10">
              {isPostOwner && onEdit && (
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    onEdit(post);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm"
                >
                  Edit Post
                </button>
              )}
              {isPostOwner && onDelete && (
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    onDelete(post.id);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-medium border-t"
                >
                  Delete Post
                </button>
              )}
              {!isPostOwner && (
                <button
                  onClick={() => {
                    setShowReportModal(true);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-yellow-50 dark:hover:bg-gray-700 text-orange-600 font-medium flex items-center space-x-2 text-sm"
                >
                  <Flag size={16} />
                  <span>Report Post</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      {post.styling?.background ? (
        (() => {
          const BACKGROUNDS = [
            { id: 'gradient-1', style: 'linear-gradient(to bottom right, rgb(251, 146, 60), rgb(239, 68, 68), rgb(126, 34, 206))' },
            { id: 'gradient-2', style: 'linear-gradient(to bottom right, rgb(96, 165, 250), rgb(34, 211, 238), rgb(20, 184, 166))' },
            { id: 'gradient-3', style: 'linear-gradient(to bottom right, rgb(74, 222, 128), rgb(16, 185, 129), rgb(34, 211, 238))' },
            { id: 'gradient-4', style: 'linear-gradient(to bottom right, rgb(192, 132, 250), rgb(236, 72, 153), rgb(239, 68, 68))' },
            { id: 'gradient-5', style: 'linear-gradient(to bottom right, rgb(253, 224, 71), rgb(251, 146, 60), rgb(220, 38, 38))' },
            { id: 'gradient-6', style: 'linear-gradient(to bottom right, rgb(196, 181, 253), rgb(168, 85, 247), rgb(99, 102, 241))' },
          ];

          const findBg = BACKGROUNDS.find((b) => b.id === (post.styling?.background || post.background)) || BACKGROUNDS[0];

          const getVariants = (anim?: string) => {
            if (!anim || anim === 'none') return { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: {} };
            switch (anim) {
              case 'bounce':
                return { initial: { y: 0, opacity: 1 }, animate: { y: [0, -12, 0], opacity: [1, 1, 1] }, transition: { duration: 0.8, repeat: Infinity } };
              case 'pulse':
                return { initial: { scale: 1, opacity: 1 }, animate: { scale: [1, 1.05, 1], opacity: [1, 0.95, 1] }, transition: { duration: 2, repeat: Infinity } };
              case 'shake':
                return { initial: { x: 0 }, animate: { x: [-6, 6, -6, 6, 0] }, transition: { duration: 0.6, repeat: Infinity } };
              case 'rotate':
                return { initial: { rotate: 0 }, animate: { rotate: 360 }, transition: { duration: 4, repeat: Infinity, ease: 'linear' } };
              default:
                return { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: {} };
            }
          };

          const variants = getVariants(post.styling?.animation);

          return (
            <div className="p-4">
              <div
                className="text-post-card w-full"
                style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.12), rgba(0,0,0,0.12)), ${findBg.style}` }}
              >
                <div className="py-6 md:py-8 lg:py-10 px-4 md:px-6 lg:px-8">
                  <div className="max-w-[760px] mx-auto">
                    <p className="text-center text-white font-semibold md:font-semibold text-base md:text-lg lg:text-xl leading-relaxed md:leading-snug break-words text-post-shadow">
                      {post.content}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      ) : (
        <div className="p-4">
          <div className="max-w-[760px] mx-auto">
            <p className="text-gray-900 dark:text-gray-100 leading-relaxed break-words text-sm md:text-base">{post.content}</p>
          </div>
        </div>
      )}

      {/* Post Media - Images */}
      {images && images.length > 0 && (
        <div className={`grid gap-1 md:gap-2 px-3 md:px-4 pb-4 w-full ${
          images.length === 1 ? 'grid-cols-1' :
          images.length === 2 ? 'grid-cols-2' :
          'grid-cols-2 grid-rows-2'
        }`}>
          {images.map((image, index) => (
            <div
              key={index}
              className="relative bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer group w-full"
              onClick={() => {
                setSelectedImageIndex(index);
                setShowImageViewer(true);
              }}
            >
              <img
                src={optimizeImageUrl(image, 1200, 1200) || image}
                alt={`Post media ${index + 1}`}
                className={`w-full h-full ${images.length === 1 ? 'object-contain max-h-96 md:max-h-[500px]' : 'object-cover aspect-square'} group-hover:opacity-90`}
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </div>
      )}

      {/* Post Media - Videos */}
      {videos && videos.length > 0 && (
        <div className="px-3 md:px-4 pb-4 space-y-3 w-full">
          {videos.map((video, index) => (
            <div key={index} className="w-full">
              <VideoPlayer
                src={video}
                title={`Video ${index + 1}`}
                allowDownload={true}
                className="w-full h-auto max-h-96 md:max-h-[500px]"
              />
            </div>
          ))}
        </div>
      )}

      {/* Engagement Stats */}
      <div className="px-3 md:px-4 py-2 border-t border-b text-xs md:text-sm text-gray-600 dark:text-gray-400 flex justify-between">
        <span>{likeCount} likes</span>
        <div className="flex space-x-2 md:space-x-4">
          <span>{commentCount} comments</span>
          <span className="hidden sm:inline">{shareCount} shares</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-2 md:p-4 flex flex-wrap justify-between items-start relative gap-2 overflow-visible">
        {/* Like Button with Facebook-style Emoji Menu */}
        <div
          ref={likeButtonRef}
          className="relative flex-1 min-w-max"
          onMouseEnter={handleEmojiMenuEnter}
          onMouseLeave={handleEmojiMenuLeave}
          onTouchStart={(e) => {
            if (isTouchDevice) {
              touchPressTimeoutRef.current = setTimeout(() => setShowEmojiMenu(true), 400);
            }
          }}
          onTouchEnd={() => {
            if (touchPressTimeoutRef.current) {
              clearTimeout(touchPressTimeoutRef.current);
              touchPressTimeoutRef.current = null;
            }
          }}
          onTouchMove={() => {
            if (touchPressTimeoutRef.current) {
              clearTimeout(touchPressTimeoutRef.current);
              touchPressTimeoutRef.current = null;
            }
          }}
        >
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base flex-shrink-0 ${
              liked
                ? 'text-primary'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <HeartIcon className={`w-4 h-4 md:w-5 md:h-5 ${liked ? 'fill-primary' : ''}`} fill={liked} />
            <span className="hidden sm:inline">Like</span>
          </button>

          {/* Facebook-style Emoji Reaction Menu - portalized to document.body to avoid clipping */}
          {showEmojiMenu && (typeof document !== 'undefined' && emojiPortalStyle ? createPortal(
            <div style={emojiPortalStyle} onMouseEnter={handleEmojiMenuEnter} onMouseLeave={handleEmojiMenuLeave}>
              <div style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.95), rgba(37,99,235,0.95))', backdropFilter: 'blur(8px)' }} className="rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl z-50">
                <div className="grid grid-cols-5 gap-2 sm:gap-3 w-full">
                  {reactionEmojis.map((reactionData) => (
                    <button
                      key={reactionData.emoji}
                      onClick={() => handleEmojiReaction(reactionData)}
                      onMouseEnter={() => setHoveredReaction(reactionData.emoji)}
                      onMouseLeave={() => setHoveredReaction(null)}
                      className="aspect-square flex items-center justify-center text-2xl sm:text-3xl md:text-4xl cursor-pointer rounded-lg sm:rounded-xl hover:bg-white/20 transition-all duration-200 relative group"
                      title={reactionData.label}
                    >
                      <span className="transform group-hover:scale-110 transition-transform duration-200">
                        {reactionData.emoji}
                      </span>
                      {hoveredReaction === reactionData.emoji && (
                        <div className="absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 sm:px-3 py-1 sm:py-2 whitespace-nowrap font-semibold z-50">
                          {reactionData.label}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>,
            document.body
          ) : (
            // fallback (if portal style not yet calculated) render inline menu
            <div
              className="absolute bottom-full mb-2 sm:mb-3 left-1/2 -translate-x-1/2 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-2xl z-50 w-64 sm:w-72 md:w-80"
              onMouseEnter={handleEmojiMenuEnter}
              onMouseLeave={handleEmojiMenuLeave}
              style={{ background: 'linear-gradient(135deg, rgba(96,165,250,0.95), rgba(37,99,235,0.95))', backdropFilter: 'blur(8px)' }}
            >
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {reactionEmojis.map((reactionData) => (
                  <button
                    key={reactionData.emoji}
                    onClick={() => handleEmojiReaction(reactionData)}
                    onMouseEnter={() => setHoveredReaction(reactionData.emoji)}
                    onMouseLeave={() => setHoveredReaction(null)}
                    className="aspect-square flex items-center justify-center text-2xl sm:text-3xl md:text-4xl cursor-pointer rounded-lg sm:rounded-xl hover:bg-white/20 transition-all duration-200 relative group"
                    title={reactionData.label}
                  >
                    <span className="transform group-hover:scale-110 transition-transform duration-200">
                      {reactionData.emoji}
                    </span>
                    {hoveredReaction === reactionData.emoji && (
                      <div className="absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs rounded px-2 sm:px-3 py-1 sm:py-2 whitespace-nowrap font-semibold z-50">
                        {reactionData.label}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Floating Emoji Animation */}
          {floatingEmoji && (
            <div
              key={floatingEmoji.id}
              className="absolute pointer-events-none text-2xl md:text-3xl"
              style={{ left: '20px', bottom: '50px' }}
            >
              {floatingEmoji.emoji}
            </div>
          )}
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
        >
          <MessageCircle size={18} />
          <span className="hidden sm:inline">Comment</span>
        </button>

        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 flex-shrink-0"
        >
          <Share2 size={18} />
          <span className="hidden sm:inline">Share</span>
        </button>

        <button
          onClick={handleSave}
          className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base flex-shrink-0 ${
            saved
              ? 'text-primary bg-primary/10'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
          }`}
        >
          <Bookmark
            size={18}
            className={saved ? 'fill-current' : ''}
          />
          <span className="hidden sm:inline">Save</span>
        </button>
      </div>      {/* Reaction Counter Display - Compact style with modal */}
      {totalReactions > 0 && (
        <>
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-gray-200 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Show top 4 reactions, overflow hidden */}
              <div className="flex gap-1 sm:gap-1.5 overflow-x-hidden">
                {Object.entries(reactionCounts)
                  .filter(([_, count]) => count > 0)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 4)
                  .map(([emoji, count]) => (
                    <button
                      key={emoji}
                      onClick={() => setSelectedReactionEmoji(emoji)}
                      className="inline-flex items-center gap-0.5 bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-full px-2 sm:px-2.5 py-1 cursor-pointer transition-all hover:scale-110 active:scale-95 flex-shrink-0 text-xs sm:text-sm"
                    >
                      <span>{emoji}</span>
                      <span className="font-bold text-blue-700">{count}</span>
                    </button>
                  ))}
                {/* If more than 4 reactions, show remaining count */}
                {Object.entries(reactionCounts).filter(([_, count]) => count > 0).length > 4 && (
                  <button
                    onClick={() => {
                      const moreReactions = Object.entries(reactionCounts)
                        .filter(([_, count]) => count > 0)
                        .slice(4);
                      if (moreReactions.length > 0) {
                        setSelectedReactionEmoji(moreReactions[0][0]);
                      }
                    }}
                    className="inline-flex items-center gap-1 bg-gray-200 hover:bg-gray-300 rounded-full px-2 sm:px-2.5 py-1 cursor-pointer transition-all hover:scale-110 active:scale-95 flex-shrink-0 text-xs font-bold text-gray-700"
                  >
                    +{Object.entries(reactionCounts)
                      .filter(([_, count]) => count > 0)
                      .slice(4)
                      .reduce((sum, [_, count]) => sum + count, 0)}
                  </button>
                )}
              </div>
              <span className="text-xs text-gray-500 ml-auto flex-shrink-0">
                {totalReactions}
              </span>
            </div>
          </div>

          {/* Reactions Modal - Blue Gradient Card */}
          {selectedReactionEmoji && (
            <div 
              className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-3 sm:p-4"
              onClick={() => setSelectedReactionEmoji(null)}
            >
              <div 
                className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full max-h-[70vh] sm:max-h-96 overflow-hidden flex flex-col"
                onClick={e => e.stopPropagation()}
              >
                {/* Header */}
                <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-blue-300/30 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-3xl sm:text-4xl flex-shrink-0">{selectedReactionEmoji}</span>
                    <div className="min-w-0">
                      <p className="text-white font-bold text-sm sm:text-base">Réactions</p>
                      <p className="text-blue-100 text-xs sm:text-sm">{(reactionUsers[selectedReactionEmoji] || []).length} utilisateurs</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedReactionEmoji(null)}
                    className="text-white hover:bg-blue-500/50 rounded-full p-1.5 sm:p-2 transition-colors flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>

                {/* Users List */}
                <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 sm:py-4">
                  <div className="space-y-2 sm:space-y-3">
                    {(reactionUsers[selectedReactionEmoji] || []).map((user, idx) => (
                      <div key={`${user.id}-${idx}`} className="flex items-center gap-2 sm:gap-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl p-2 sm:p-3 hover:bg-white/30 transition-colors">
                        <div className="w-8 sm:w-10 h-8 sm:h-10 rounded-full bg-white/40 flex items-center justify-center text-white font-bold flex-shrink-0 text-xs sm:text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-xs sm:text-sm truncate">{user.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
      {/* Comments Section - Inline */}
      {showComments && (
        <div className="border-t bg-gray-50">
          {/* Comments List */}
          <div className="p-4 max-h-96 overflow-y-auto">
            <CommentThread 
              postId={post.id}
              comments={comments}
              onCommentAdded={(newComment) => {
                setComments(prev => [...prev, newComment]);
                setCommentCount(prev => prev + 1);
              }}
            />
          </div>

          {/* Comment Input */}
          <div className="border-t p-4 bg-white">
            <form onSubmit={handleSubmitComment} className="flex space-x-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmittingComment}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      )}

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
            if (typeof window !== 'undefined' && window.location.pathname !== '/') {
              incrementHomeActivity();
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Error sharing post';
            console.error('Share error:', errorMsg);
            throw err;
          }
        }}
        postContent={post.content}
      />

      {/* Image Viewer */}
      <PublicationFullscreenViewer
        post={post}
        initialImageIndex={selectedImageIndex}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        onLike={onLike}
        onDelete={onDelete}
      />

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 sm:mx-0">
            <div className="p-4 sm:p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Flag size={24} className="text-orange-600" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Report Post</h2>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-xs sm:text-sm">
                Help us understand why you're reporting this post. Your report is anonymous and will be reviewed by our team.
              </p>

              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Please describe why you're reporting this post..."
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none text-xs sm:text-sm"
                rows={4}
              />

              <div className="mt-6 flex gap-2 sm:gap-3">
                <button
                  onClick={() => {
                    setShowReportModal(false);
                    setReportReason('');
                  }}
                  className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReportPost}
                  disabled={!reportReason.trim() || isReporting}
                  className="flex-1 px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center space-x-2 text-xs sm:text-sm"
                >
                  {isReporting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                      <span>Reporting...</span>
                    </>
                  ) : (
                    <>
                      <Flag size={16} />
                      <span>Report</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}    </div>
  );
}