'use client';

import { useState, useRef } from 'react';
import { MessageCircle, Share2, Bookmark, MoreVertical, X, Send } from 'lucide-react';
import { HeartIcon } from '@/components/HeartIcon';
import { motion } from 'framer-motion';
import { useHomeActivity } from '@/contexts/HomeActivityContext';
import ShareModal from '@/components/post/ShareModal';
import { PostImageViewer } from '@/components/PostImageViewer';
import { VideoPlayer } from '@/components/VideoPlayer';
import { CommentThread } from '@/components/CommentThread';
import { optimizeAvatarUrl, optimizeImageUrl } from '@/lib/cloudinaryOptimizer';
import { Avatar } from '@/components/ui/Avatar';

interface PostProps {
  post: any;
  onEdit?: (post: any) => void;
  onDelete?: (postId: string) => void;
  onLike?: (postId: string) => void;
  onCommentAdded?: () => void | Promise<void>;
}

export default function Post({ post, onEdit, onDelete, onLike, onCommentAdded }: PostProps) {
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
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({
    '❤️': 0,
    '😢': 0,
    '😮': 0,
    '🫂': 0,
  });
  const [hoveredReaction, setHoveredReaction] = useState<string | null>(null);
  const [floatingEmoji, setFloatingEmoji] = useState<{ emoji: string; id: number } | null>(null);
  const floatingEmojiIdRef = useRef(0);
  const optionsMenuRef = useRef<HTMLDivElement>(null);
  const likeButtonRef = useRef<HTMLDivElement>(null);

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
    // Add floating emoji animation
    const newId = floatingEmojiIdRef.current++;
    setFloatingEmoji({ emoji: emojiData.emoji, id: newId });
    setTimeout(() => setFloatingEmoji(null), 1000);
    setShowEmojiMenu(false);
  };

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
  const images: string[] = (post?.images ?? (post?.media ? post.media.map((m: any) => m.type !== 'video' ? m.url : null).filter(Boolean) : []))
    .filter(Boolean)
    .map((u: string) => u as string);
  const videos: string[] = post?.videos ?? (post?.media ? post.media.map((m: any) => m.type === 'video' ? m.url : null).filter(Boolean) : []);
  const createdAt = post?.createdAt ?? post?.created_at ?? new Date();

  return (
    <div className="bg-white dark:bg-gray-900 border border-border rounded-lg md:rounded-lg shadow-sm mb-4 overflow-hidden hover:shadow-md transition-shadow duration-200 w-full">
      {/* Post Header */}
      <div className="p-3 md:p-4 flex items-center justify-between border-b border-border gap-2">
        <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
          {/* User Avatar */}
          <Avatar src={optimizeAvatarUrl(author.avatar, 40) || author.avatar || null} name={author.name} size="md" className="w-10 h-10 flex-shrink-0" />
          {/* User Info */}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 dark:text-white text-sm md:text-base truncate">{author.name}</p>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 truncate">@{author.username || 'username'} • {formatDate(createdAt)}</p>
          </div>
        </div>

        {/* Options Menu */}
        <div className="relative flex-shrink-0" ref={optionsMenuRef}>
          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors duration-200"
          >
            <MoreVertical size={18} className="text-gray-600 dark:text-gray-400" />
          </button>

          {showOptionsMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 border border-border">
              {onEdit && (
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    onEdit(post);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium transition-colors duration-200 text-sm"
                >
                  Edit Post
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    onDelete(post.id);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 font-medium transition-colors duration-200 border-t border-border"
                >
                  Delete Post
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Post Content */}
      <div className="p-4">
        <p className="text-gray-900 dark:text-gray-100 leading-relaxed break-words text-sm md:text-base">{post.content}</p>
      </div>

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
                className={`w-full h-full ${images.length === 1 ? 'object-contain max-h-96 md:max-h-[500px]' : 'object-cover aspect-square'} group-hover:opacity-90 transition-opacity duration-200`}
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
      <div className="px-3 md:px-4 py-2 border-t border-b border-border text-xs md:text-sm text-gray-600 dark:text-gray-400 flex justify-between">
        <span>{likeCount} likes</span>
        <div className="flex space-x-2 md:space-x-4">
          <span>{commentCount} comments</span>
          <span className="hidden sm:inline">{shareCount} shares</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-2 md:p-4 flex flex-wrap justify-between items-start relative gap-2">
        {/* Like Button with Facebook-style Emoji Menu */}
        <div
          ref={likeButtonRef}
          className="relative flex-1 min-w-max"
          onMouseEnter={() => setShowEmojiMenu(true)}
          onMouseLeave={() => setShowEmojiMenu(false)}
        >
          <button
            onClick={handleLike}
            className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-all duration-200 flex-shrink-0 ${
              liked
                ? 'text-primary'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <HeartIcon className={`w-4 h-4 md:w-5 md:h-5 ${liked ? 'fill-primary' : ''}`} fill={liked} />
            <span className="hidden sm:inline">Like</span>
          </button>

          {/* Facebook-style Emoji Reaction Menu */}
          {showEmojiMenu && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 rounded-3xl px-2 py-2 flex gap-1 shadow-xl z-50 border border-gray-200 dark:border-gray-700"
            >
              {reactionEmojis.map((reactionData, idx) => (
                <motion.button
                  key={reactionData.emoji}
                  onClick={() => handleEmojiReaction(reactionData)}
                  onMouseEnter={() => setHoveredReaction(reactionData.emoji)}
                  onMouseLeave={() => setHoveredReaction(null)}
                  whileHover={{ scale: 1.4, y: -12 }}
                  whileTap={{ scale: 0.85 }}
                  initial={{ opacity: 0, y: 20, scale: 0 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0 }}
                  transition={{ 
                    type: 'spring', 
                    stiffness: 300, 
                    damping: 20,
                    delay: idx * 0.05
                  }}
                  className="text-2xl md:text-3xl cursor-pointer p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 relative"
                  title={reactionData.label}
                >
                  {reactionData.emoji}
                  {hoveredReaction === reactionData.emoji && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap font-semibold z-10"
                    >
                      {reactionData.label}
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}

          {/* Floating Emoji Animation */}
          {floatingEmoji && (
            <motion.div
              key={floatingEmoji.id}
              initial={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              animate={{ opacity: 0, y: -40, scale: 1.2 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute pointer-events-none text-2xl md:text-3xl"
              style={{ left: '20px', bottom: '50px' }}
            >
              {floatingEmoji.emoji}
            </motion.div>
          )}
        </div>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 flex-shrink-0"
        >
          <MessageCircle size={18} />
          <span className="hidden sm:inline">Comment</span>
        </button>

        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 flex-shrink-0"
        >
          <Share2 size={18} />
          <span className="hidden sm:inline">Share</span>
        </button>

        <button
          onClick={handleSave}
          className={`flex items-center space-x-1 md:space-x-2 px-2 md:px-4 py-2 rounded-lg font-medium text-sm md:text-base transition-all duration-200 flex-shrink-0 ${
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
      </div>      {/* Reaction Counter Display - Facebook style */}
      {totalReactions > 0 && (
        <div className="px-4 py-2 border-t border-gray-200 text-sm">
          <div className="flex items-center gap-2 text-gray-700">
            {/* Reaction pills */}
            <div className="flex gap-1">
              {Object.entries(reactionCounts)
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([emoji, count]) => (
                  <motion.div
                    key={emoji}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="inline-flex items-center gap-1 bg-gray-100 hover:bg-gray-200 rounded-full px-2 py-1 cursor-pointer transition-colors"
                  >
                    <span className="text-base">{emoji}</span>
                    <span className="text-xs font-semibold text-gray-700">{count}</span>
                  </motion.div>
                ))}
            </div>
            <span className="text-xs text-gray-500">
              {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
            </span>
          </div>
        </div>
      )}
      {/* Comments Section - Inline */}
      {showComments && (
        <div className="border-t border-border bg-gray-50">
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
          <div className="border-t border-border p-4 bg-white">
            <form onSubmit={handleSubmitComment} className="flex space-x-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!commentText.trim() || isSubmittingComment}
                className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
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
      <PostImageViewer
        post={post}
        initialImageIndex={selectedImageIndex}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        onLike={onLike}
        onDelete={onDelete}
      />
    </div>
  );
}
