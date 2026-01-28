'use client';

import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, MoreHorizontal, Trash2, Edit } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CommentForm } from './CommentForm';
import { formatDate, cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { PostWithDetails } from '@/types';
import { motion } from 'framer-motion';

interface PostProps {
  post: PostWithDetails;
  currentUserId?: string;
  onLike?: (postId: string) => void;
  onDelete?: (postId: string) => void;
  onCommentAdded?: () => void;
}

export function Post({ post, currentUserId, onLike, onDelete, onCommentAdded }: PostProps) {
  const { translation } = useLanguage();
  const [showComments, setShowComments] = useState(false);
  const [liked, setLiked] = useState(false);

  const isOwner = post.user.id === currentUserId;
  const likeCount = post._count?.likes || post.likes.length;

  const handleLike = () => {
    setLiked(!liked);
    onLike?.(post.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-4 overflow-hidden">
        {/* Post Header */}
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar
                src={post.user.avatar}
                name={post.user.fullName || post.user.username}
                size="md"
              />
              <div>
                <h3 className="font-semibold text-gray-900">
                  {post.user.fullName || post.user.username}
                </h3>
                <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
              </div>
            </div>
            <div className="relative group">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <MoreHorizontal className="w-5 h-5 text-gray-500" />
              </button>
              {isOwner && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border py-1 hidden group-hover:block z-10">
                  <button
                    onClick={() => onDelete?.(post.id)}
                    className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="text-sm">{translation.common.delete}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Post Content */}
        <div
          className={cn(
            'p-4',
            post.background && 'bg-gradient-to-br from-blue-50 to-purple-50'
          )}
          style={post.background ? { backgroundImage: post.background } : undefined}
        >
          <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>

          {/* Media */}
          {post.media.length > 0 && (
            <div className="mt-4 space-y-2">
              {post.media.map((media) => (
                <div key={media.id} className="rounded-lg overflow-hidden">
                  {media.type === 'image' ? (
                    <img
                      src={media.url}
                      alt="Post media"
                      className="w-full object-cover max-h-96"
                    />
                  ) : (
                    <video
                      src={media.url}
                      controls
                      className="w-full max-h-96"
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Post Actions */}
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleLike}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
                  liked
                    ? 'text-red-600 bg-red-50'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <Heart className={cn('w-5 h-5', liked && 'fill-current')} />
                <span className="text-sm font-medium">{likeCount}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {post._count?.comments || post.comments.length}
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-gray-100 p-4 bg-gray-50"
          >
            {post.comments.length > 0 ? (
              <div className="space-y-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar
                      src={comment.user.avatar}
                      name={comment.user.fullName || comment.user.username}
                      size="sm"
                    />
                    <div className="flex-1">
                      <div className="bg-white rounded-lg px-4 py-2">
                        <p className="font-semibold text-sm text-gray-900">
                          {comment.user.fullName || comment.user.username}
                        </p>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-2">
                        {formatDate(comment.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                {translation.post.comment}
              </p>
            )}

            {/* Comment Form */}
            <CommentForm postId={post.id} onCommentAdded={onCommentAdded} />
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}