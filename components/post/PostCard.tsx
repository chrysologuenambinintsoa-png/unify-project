'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HeartIcon } from '@/components/HeartIcon';
import { useHomeActivity } from '@/contexts/HomeActivityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import ReactionPicker from './ReactionPicker';
import ShareModal from './ShareModal';

interface PostCardProps {
  post: Post;
  onEdit?: (post: Post) => void;
  onDelete?: (postId: string) => void;
}

interface Post {
  id: string;
  content: string;
  images: string[];
  videos: string[];
  timestamp: Date;
  styling?: any;
}

interface Comment {
  id: string;
  user: string;
  avatar: string;
  content: string;
  timestamp: Date;
  replies?: Comment[];
}

export default function PostCard({ post, onEdit, onDelete }: PostCardProps) {
  const { translation } = useLanguage();
  const { incrementHomeActivity } = useHomeActivity();
  const [currentReaction, setCurrentReaction] = useState<string>('');

  // Use server-provided counts when available instead of random placeholders
  const initialLikeCount: number = Array.isArray((post as any).likes)
    ? (post as any).likes.length
    : typeof (post as any).likes === 'number'
    ? (post as any).likes
    : (post as any)._count?.likes ?? 0;

  const initialCommentCount: number = Array.isArray((post as any).comments)
    ? (post as any).comments.length
    : typeof (post as any).comments === 'number'
    ? (post as any).comments
    : (post as any)._count?.comments ?? 0;

  const initialShareCount: number = typeof (post as any).shares === 'number' ? (post as any).shares : 0;

  const [liked, setLiked] = useState(!!(post as any).liked);
  const [likeCount, setLikeCount] = useState<number>(initialLikeCount);
  const [commentCount, setCommentCount] = useState<number>(initialCommentCount);
  const [shareCount, setShareCount] = useState<number>(initialShareCount);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [expandedReplies, setExpandedReplies] = useState<{ [key: string]: boolean }>({});
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionPickerPosition, setReactionPickerPosition] = useState<{ x: number; y: number } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const likeButtonRef = useRef<HTMLButtonElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  const handleLike = (reaction: string = 'Like') => {
    // Cases:
    // - not liked: add like with reaction -> increment count
    // - liked and same reaction: remove like -> decrement count
    // - liked and different reaction: switch reaction (no count change)
    if (!liked) {
      setLiked(true);
      setCurrentReaction(reaction);
      setLikeCount(prev => prev + 1);
      // Increment home activity badge if user is not on home page
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        incrementHomeActivity();
      }
      return;
    }

    // already liked
    if (currentReaction === reaction) {
      // toggle off
      setLiked(false);
      setCurrentReaction('');
      setLikeCount(prev => Math.max(0, prev - 1));
    } else {
      // change reaction without affecting total like count
      setCurrentReaction(reaction);
    }

    // Increment home activity badge if user is not on home page
    if (typeof window !== 'undefined' && window.location.pathname !== '/') {
      incrementHomeActivity();
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        user: 'You',
        avatar: 'Y',
        content: newComment,
        timestamp: new Date(),
      };
      setComments(prev => [...prev, newCommentObj]);
      setCommentCount(prev => prev + 1);
      setNewComment('');
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const handleSharePost = async (shareType: 'message' | 'group', recipientId: string, message?: string) => {
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
  };

  const handleSave = () => {
    setSaved(!saved);
  };

  const handleLikeButtonLongPress = () => {
    if (likeButtonRef.current) {
      const rect = likeButtonRef.current.getBoundingClientRect();
      setReactionPickerPosition({
        x: rect.left,
        y: rect.top - 200,
      });
      setShowReactionPicker(true);
    }
  };

  const handleEditPost = () => {
    setShowOptionsMenu(false);
    if (onEdit) {
      onEdit(post);
    }
  };

  const handleDeletePost = () => {
    setShowOptionsMenu(false);
    if (onDelete && window.confirm(translation.messages?.confirmDeletePost || 'Are you sure you want to delete this post?')) {
      onDelete(post.id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setShowOptionsMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const highlightContent = (content: string) => {
    // Highlight hashtags
    const highlightedHashtags = content.replace(/#(\w+)/g, '<span class="text-primary font-semibold hover:underline cursor-pointer">#$1</span>');
    
    // Highlight mentions
    const highlightedMentions = highlightedHashtags.replace(/@(\w+)/g, '<span class="text-primary font-semibold hover:underline cursor-pointer">@$1</span>');
    
    return highlightedMentions;
  };

  return (
    <div className="bg-white rounded-lg shadow-md mb-4">
      {/* Post Header */}
      <div className="p-4">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-xl mr-3">
            U
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-800">User Name</h3>
            <p className="text-sm text-gray-500">{formatTime(post.timestamp)}</p>
          </div>
          <div className="flex items-center space-x-2 relative">
            <button
              onClick={handleSave}
              className={`text-gray-500 hover:bg-gray-100 p-2 rounded-full transition ${saved ? 'text-primary' : ''}`}
              title={saved ? 'Saved' : 'Save post'}
            >
              {saved ? '🔖' : '📑'}
            </button>
            <button
              onClick={() => setShowOptionsMenu(!showOptionsMenu)}
              className="text-gray-500 hover:bg-gray-100 p-2 rounded-full transition"
            >
              •••
            </button>
            
            {/* Options Menu */}
            {showOptionsMenu && (
              <div
                ref={optionsMenuRef}
                className="absolute right-0 top-12 bg-white rounded-lg shadow-lg py-2 z-50 w-48"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditPost();
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition flex items-center space-x-2"
                >
                  <span>✏️</span>
                  <span>{translation.buttons?.editPost || 'Edit post'}</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeletePost();
                  }}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition flex items-center space-x-2"
                >
                  <span>🗑️</span>
                  <span>{translation.buttons?.deletePost || 'Delete post'}</span>
                </button>
                <div className="border-t my-1"></div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition flex items-center space-x-2"
                >
                  <span>📌</span>
                  <span>Pin Post</span>
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowOptionsMenu(false);
                  }}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition flex items-center space-x-2"
                >
                  <span>🔔</span>
                  <span>Turn off notifications</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Content */}
      <div className="px-4 pb-2">
        {post.content && (!post.styling || (!post.images?.length && !post.videos?.length && !post.styling?.background)) && (
          <p 
            className="text-gray-800 mb-3 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: highlightContent(post.content) }}
          />
        )}

        {/* Styled text post (background + animation) */}
        {post.content && post.styling?.background && !post.images?.length && !post.videos?.length && (
          (() => {
            const BG_MAP: Record<string, string> = {
              'gradient-1': 'bg-gradient-to-br from-orange-400 via-red-500 to-purple-700',
              'gradient-2': 'bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-700',
              'gradient-3': 'bg-gradient-to-br from-green-400 via-emerald-500 to-cyan-700',
              'gradient-4': 'bg-gradient-to-br from-purple-400 via-pink-500 to-red-500',
              'gradient-5': 'bg-gradient-to-br from-yellow-300 via-orange-400 to-red-600',
              'gradient-6': 'bg-gradient-to-br from-purple-300 via-purple-500 to-indigo-700',
            };

            const anim = post.styling?.animation || 'none';

            const getVariants = () => {
              switch (anim) {
                case 'bounce':
                  return { animate: { y: [0, -8, 0] }, transition: { duration: 0.8, repeat: Infinity } };
                case 'pulse':
                  return { animate: { opacity: [1, 0.8, 1] }, transition: { duration: 2, repeat: Infinity } };
                case 'rotate':
                  return { animate: { rotateY: [0, 360] }, transition: { duration: 4, repeat: Infinity, ease: 'linear' } };
                case 'wave':
                  return { animate: { skewY: [0, 1, -1, 0] }, transition: { duration: 2, repeat: Infinity } };
                case 'shake':
                  return { animate: { x: [-4, 4, -4, 4, 0] }, transition: { duration: 0.6, repeat: Infinity } };
                case 'glow':
                  return { animate: { textShadow: ['0 0 8px rgba(255,255,255,0.3)', '0 0 20px rgba(255,255,255,0.8)', '0 0 8px rgba(255,255,255,0.3)'] }, transition: { duration: 1.5, repeat: Infinity } };
                case 'scale':
                  return { animate: { scale: [1, 1.05, 1] }, transition: { duration: 1.5, repeat: Infinity } };
                default:
                  return {};
              }
            };

            const bgClass = BG_MAP[post.styling?.background] || BG_MAP['gradient-1'];

            return (
              <div className="mb-3">
                <div className={`${bgClass} p-8 md:p-12 lg:p-16 rounded-lg w-full aspect-video md:aspect-square flex items-center justify-center`}>
                  <motion.div {...getVariants()} className="text-center">
                    <p className="text-white text-3xl md:text-5xl lg:text-6xl font-bold leading-tight break-words">
                      {post.content}
                    </p>
                  </motion.div>
                </div>
              </div>
            );
          })()
        )}
      </div>

      {/* Images */}
      {post.images.length > 0 && (
        <div className={`grid gap-1 ${post.images.length === 1 ? 'grid-cols-1' : post.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
          {post.images.map((image, index) => (
            <div key={index} className={post.images.length === 3 && index === 0 ? 'col-span-2' : ''}>
              <img
                src={image}
                alt={`Post image ${index + 1}`}
                className={`w-full h-auto object-cover ${post.images.length === 1 ? 'max-h-[500px]' : 'max-h-[300px]'}`}
              />
            </div>
          ))}
        </div>
      )}

      {/* Videos */}
      {post.videos.length > 0 && (
        <div className="space-y-2">
          {post.videos.map((video, index) => (
            <video
              key={index}
              src={video}
              controls
              className="w-full max-h-[500px]"
            />
          ))}
        </div>
      )}

      {/* Reaction Stats */}
      <div className="px-4 py-2 md:py-3 flex items-center justify-between text-gray-500 text-xs md:text-sm border-b">
        <div className="flex items-center gap-2 md:gap-4 flex-wrap">
          {likeCount > 0 && (
            <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 rounded-full">
              <span className="inline-flex items-center justify-center text-sm">
                {currentReaction === 'Love' ? '❤️' : currentReaction === 'Haha' ? '😂' : currentReaction === 'Wow' ? '😮' : currentReaction === 'Sad' ? '😢' : currentReaction === 'Angry' ? '😡' : currentReaction === 'Fire' ? '🔥' : currentReaction === 'Celebrate' ? '🎉' : '👍'}
              </span>
              <span className="font-semibold text-gray-700 dark:text-gray-300 ml-1">{likeCount}</span>
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 md:gap-4 text-gray-600 dark:text-gray-400">
          <button type="button" className="hover:underline transition">{commentCount} {translation.messages?.comments || 'comments'}</button>
          <button type="button" className="hover:underline transition">{shareCount} {translation.messages?.shares || 'shares'}</button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-2 md:px-4 py-2 md:py-3 border-b relative">
        <div className="grid grid-cols-3 gap-1 md:gap-0 md:flex md:items-center md:justify-around">
          <button
            ref={likeButtonRef}
            onClick={() => handleLike()}
            onMouseEnter={handleLikeButtonLongPress}
            className={`flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-2 rounded-lg transition text-xs md:text-sm font-medium ${
              liked ? 'text-primary bg-primary/10 dark:bg-primary-dark/20 dark:text-primary' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <div className="text-lg md:text-2xl">
              {currentReaction === 'Love' ? '❤️' : currentReaction === 'Haha' ? '😂' : currentReaction === 'Wow' ? '😮' : currentReaction === 'Sad' ? '😢' : currentReaction === 'Angry' ? '😡' : currentReaction === 'Fire' ? '🔥' : currentReaction === 'Celebrate' ? '🎉' : liked ? <HeartIcon className="w-5 h-5 md:w-6 md:h-6" fill={true} /> : <HeartIcon className="w-5 h-5 md:w-6 md:h-6" fill={false} />}
            </div>
            <span className="hidden md:inline font-semibold">{currentReaction || translation.buttons?.like || 'Like'}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xs md:text-sm font-medium"
          >
            <span className="text-lg md:text-2xl">💬</span>
            <span className="hidden md:inline">{translation.buttons?.comment || 'Comment'}</span>
          </button>

          <button
            onClick={handleShare}
            className="flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-2 px-2 md:px-4 py-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition text-xs md:text-sm font-medium"
          >
            <span className="text-lg md:text-2xl">🔄</span>
            <span className="hidden md:inline">{translation.buttons?.share || 'Share'}</span>
          </button>
        </div>

        {/* Reaction Picker */}
        {showReactionPicker && reactionPickerPosition && (
          <ReactionPicker
            position={reactionPickerPosition}
            onReact={handleLike}
            onClose={() => setShowReactionPicker(false)}
          />
        )}
      </div>

      {/* Share Modal */}
      <ShareModal
        postId={post.id}
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        onShare={handleSharePost}
        postContent={post.content}
      />

      {/* Comments Section */}
      {showComments && (
        <div className="px-4 py-3">
          {/* Existing Comments */}
          {comments.length > 0 && (
            <div className="space-y-3 mb-3">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                    {comment.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="bg-gray-100 rounded-lg px-3 py-2">
                      <p className="font-semibold text-sm text-gray-800">{comment.user}</p>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 ml-2">
                      <button className="text-xs text-gray-500 hover:text-gray-700">Like</button>
                      <button className="text-xs text-gray-500 hover:text-gray-700">Reply</button>
                      <span className="text-xs text-gray-400">{formatTime(comment.timestamp)}</span>
                    </div>
                    {/* Show/Hide Replies Button */}
                    {comment.replies && comment.replies.length > 0 && (
                      <button
                        onClick={() => setExpandedReplies(prev => ({
                          ...prev,
                          [comment.id]: !prev[comment.id]
                        }))}
                        className="mt-1 ml-2 text-xs text-primary hover:text-primary-dark font-semibold"
                      >
                        {expandedReplies[comment.id] 
                          ? '▼ Masquer les réponses' 
                          : `▶ Afficher ${comment.replies.length} réponse${comment.replies.length > 1 ? 's' : ''}`
                        }
                      </button>
                    )}
                    {/* Replies Section */}
                    {comment.replies && comment.replies.length > 0 && expandedReplies[comment.id] && (
                      <div className="ml-8 mt-3 space-y-2 border-l-2 border-gray-200 pl-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start space-x-2">
                            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                              {reply.avatar}
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-lg px-2 py-1">
                                <p className="font-semibold text-xs text-gray-800">{reply.user}</p>
                                <p className="text-xs text-gray-700">{reply.content}</p>
                              </div>
                              <div className="flex items-center space-x-3 mt-0.5 ml-0 text-xs">
                                <button className="text-gray-500 hover:text-gray-700">Like</button>
                                <span className="text-gray-400">{formatTime(reply.timestamp)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment */}
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
              Y
            </div>
            <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-sm"
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                className="text-primary font-semibold text-sm hover:text-primary/80 disabled:text-gray-400 ml-2"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
