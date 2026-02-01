'use client';

import { useState, useRef } from 'react';
import { MessageCircle, Share2, Bookmark, MoreVertical, X } from 'lucide-react';
import { HeartIcon } from '@/components/HeartIcon';
import { useHomeActivity } from '@/contexts/HomeActivityContext';
import ShareModal from '@/components/post/ShareModal';

interface PostProps {
  post: any;
  onEdit?: (post: any) => void;
  onDelete?: (postId: string) => void;
  onLike?: (postId: string) => void;
  onCommentAdded?: () => void | Promise<void>;
}

export default function Post({ post, onEdit, onDelete, onLike }: PostProps) {
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
  const [saved, setSaved] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalImage, setModalImage] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

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
  const images: string[] = post?.images ?? (post?.media ? post.media.map((m: any) => m.url).filter(Boolean) : []);
  const createdAt = post?.createdAt ?? post?.created_at ?? new Date();

  return (
    <div className="bg-white border border-border rounded-lg shadow-sm mb-4 overflow-hidden hover:shadow-md transition-shadow duration-200">
      {/* Post Header */}
      <div className="p-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center space-x-3">
          {/* User Avatar */}
          <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-sm overflow-hidden">
            {author.avatar ? (
              <img 
                src={author.avatar} 
                alt={author.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              (author.name || 'U').charAt(0).toUpperCase()
            )}
          </div>
          {/* User Info */}
          <div>
            <p className="font-semibold text-gray-900">{author.name}</p>
            <p className="text-sm text-gray-500">@{author.username || 'username'} • {formatDate(createdAt)}</p>
          </div>
        </div>

        {/* Options Menu */}
        <div className="relative" ref={optionsMenuRef}>
          <button
            onClick={() => setShowOptionsMenu(!showOptionsMenu)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <MoreVertical size={18} className="text-gray-600" />
          </button>

          {showOptionsMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10 border border-border">
              {onEdit && (
                <button
                  onClick={() => {
                    setShowOptionsMenu(false);
                    onEdit(post);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 font-medium transition-colors duration-200"
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
        <p className="text-gray-900 leading-relaxed break-words">{post.content}</p>
      </div>

      {/* Post Media */}
      {images && images.length > 0 && (
        <div className={`grid gap-2 px-4 pb-4 ${
          images.length === 1 ? 'grid-cols-1' :
          images.length === 2 ? 'grid-cols-2' :
          'grid-cols-2 grid-rows-2'
        }`}>
          {images.map((image, index) => (
            <div
              key={index}
              className="relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer group aspect-square"
              onClick={() => {
                setModalImage(image);
                setShowModal(true);
              }}
            >
              <img
                src={image}
                alt={`Post media ${index + 1}`}
                className="w-full h-full object-cover group-hover:opacity-90 transition-opacity duration-200"
              />
            </div>
          ))}
        </div>
      )}

      {/* Engagement Stats */}
      <div className="px-4 py-2 border-t border-b border-border text-sm text-gray-600 flex justify-between">
        <span>{likeCount} likes</span>
        <div className="flex space-x-4">
          <span>{commentCount} comments</span>
          <span>{shareCount} shares</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 flex justify-between">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            liked
              ? 'text-primary'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <HeartIcon className={`w-5 h-5 ${liked ? 'fill-primary' : ''}`} fill={liked} />
          <span>Like</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-200"
        >
          <MessageCircle size={18} />
          <span>Comment</span>
        </button>

        <button
          onClick={() => setShowShareModal(true)}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg font-medium text-gray-600 hover:bg-gray-100 transition-colors duration-200"
        >
          <Share2 size={18} />
          <span>Share</span>
        </button>

        <button
          onClick={handleSave}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
            saved
              ? 'text-primary bg-primary/10'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Bookmark
            size={18}
            className={saved ? 'fill-current' : ''}
          />
          <span>Save</span>
        </button>
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

      {/* Image Modal */}
      {showModal && modalImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setShowModal(false);
            setModalImage(null);
          }}
        >
          <div
            className="relative max-w-2xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                setShowModal(false);
                setModalImage(null);
              }}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors duration-200"
            >
              <X size={28} />
            </button>
            <img
              src={modalImage}
              alt="Full size"
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}
