'use client';

import { useState, useRef, useEffect } from 'react';
import { HeartIcon } from '@/components/HeartIcon';
import { useHomeActivity } from '@/contexts/HomeActivityContext';
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
  const [liked, setLiked] = useState(false);
  const { incrementHomeActivity } = useHomeActivity();
  const [currentReaction, setCurrentReaction] = useState<string>('');
  const [likeCount, setLikeCount] = useState(Math.floor(Math.random() * 100));
  const [commentCount, setCommentCount] = useState(Math.floor(Math.random() * 20));
  const [shareCount, setShareCount] = useState(Math.floor(Math.random() * 10));
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [reactionPickerPosition, setReactionPickerPosition] = useState<{ x: number; y: number } | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const likeButtonRef = useRef<HTMLButtonElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  const handleLike = (reaction: string = 'Like') => {
    if (!liked) {
      setLiked(true);
      setCurrentReaction(reaction);
      setLikeCount(prev => prev + 1);
    } else {
      setLiked(false);
      setCurrentReaction('');
      setLikeCount(prev => prev - 1);
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
    if (onDelete && window.confirm('Are you sure you want to delete this post?')) {
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
                className="absolute right-0 top-12 bg-white rounded-lg shadow-lg py-2 z-10 w-48"
              >
                <button
                  onClick={handleEditPost}
                  className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition flex items-center space-x-2"
                >
                  <span>✏️</span>
                  <span>Edit Post</span>
                </button>
                <button
                  onClick={handleDeletePost}
                  className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition flex items-center space-x-2"
                >
                  <span>🗑️</span>
                  <span>Delete Post</span>
                </button>
                <div className="border-t my-1"></div>
                <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition flex items-center space-x-2">
                  <span>📌</span>
                  <span>Pin Post</span>
                </button>
                <button className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 transition flex items-center space-x-2">
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
        {post.content && (
          <p 
            className="text-gray-800 mb-3 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: highlightContent(post.content) }}
          />
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
                className="w-full h-auto object-cover"
                style={{ maxHeight: post.images.length === 1 ? '500px' : '300px' }}
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
              className="w-full"
              style={{ maxHeight: '500px' }}
            />
          ))}
        </div>
      )}

      {/* Reaction Stats */}
      <div className="px-4 py-2 flex items-center justify-between text-gray-500 text-sm border-b">
        <div className="flex items-center space-x-2">
          {likeCount > 0 && (
            <span className="flex items-center">
              <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-1">
                {currentReaction === 'Love' ? '❤️' : currentReaction === 'Haha' ? '😂' : currentReaction === 'Wow' ? '😮' : currentReaction === 'Sad' ? '😢' : currentReaction === 'Angry' ? '😡' : '👍'}
              </span>
              <span>{likeCount}</span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <span>{commentCount} comments</span>
          <span>{shareCount} shares</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-2 flex items-center justify-around border-b relative">
        <button
          ref={likeButtonRef}
          onClick={() => handleLike()}
          onMouseEnter={handleLikeButtonLongPress}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
            liked ? 'text-primary' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <div className="text-xl">
            {currentReaction === 'Love' ? <HeartIcon className="w-5 h-5" fill={true} /> : currentReaction === 'Haha' ? '😂' : currentReaction === 'Wow' ? '😮' : currentReaction === 'Sad' ? '😢' : currentReaction === 'Angry' ? '😡' : liked ? <HeartIcon className="w-5 h-5" fill={true} /> : <HeartIcon className="w-5 h-5" fill={false} />}
          </div>
          <span>{currentReaction || 'Like'}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
        >
          <span className="text-xl">💬</span>
          <span>Comment</span>
        </button>

        <button
          onClick={handleShare}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
        >
          <span className="text-xl">🔄</span>
          <span>Share</span>
        </button>

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
                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="ml-8 mt-2 space-y-2">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="flex items-start space-x-2">
                            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0">
                              {reply.avatar}
                            </div>
                            <div className="bg-gray-100 rounded-lg px-2 py-1 flex-1">
                              <p className="font-semibold text-xs text-gray-800">{reply.user}</p>
                              <p className="text-xs text-gray-700">{reply.content}</p>
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