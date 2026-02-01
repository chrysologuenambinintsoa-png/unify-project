'use client';

import React, { useState, useRef } from 'react';
import { X } from 'lucide-react';

interface CommentsModalProps {
  postId: string;
  comments: any[];
  commentCount: number;
  isOpen: boolean;
  onClose: () => void;
  onCommentAdded?: () => void;
}

export function CommentsModal({
  postId,
  comments = [],
  commentCount,
  isOpen,
  onClose,
  onCommentAdded,
}: CommentsModalProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      console.log('Submitting comment for postId:', postId);
      console.log('Comment text:', commentText);
      
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText }),
      });

      console.log('Response status:', response.status);
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (response.ok) {
        console.log('Comment created successfully');
        setCommentText('');
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
        if (onCommentAdded) {
          onCommentAdded();
        }
      } else {
        console.error('Failed to create comment:', responseData);
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[80vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Comments ({commentCount})</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Comments List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {comments && Array.isArray(comments) && comments.length > 0 ? (
            comments.map((comment: any, index: number) => (
              <div key={index} className="flex space-x-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold text-xs flex-shrink-0">
                  {comment.user?.name?.charAt(0).toUpperCase() ||
                    comment.author?.name?.charAt(0).toUpperCase() ||
                    'U'}
                </div>
                {/* Comment Content */}
                <div className="flex-1">
                  <div className="bg-gray-100 rounded-lg p-3">
                    <p className="font-semibold text-sm text-gray-900">
                      {comment.user?.name || comment.author?.name || 'User'}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">
                      {comment.content || comment.text}
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {comment.createdAt
                      ? new Date(comment.createdAt).toLocaleDateString()
                      : 'Just now'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No comments yet.</p>
              <p className="text-sm text-gray-400">Be the first to comment!</p>
            </div>
          )}
        </div>

        {/* Comment Input */}
        <div className="p-4 border-t border-gray-200 flex-shrink-0 bg-gray-50">
          <form onSubmit={handleSubmitComment} className="space-y-2">
            <textarea
              ref={textareaRef}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              rows={3}
            />
            <button
              type="submit"
              disabled={!commentText.trim() || isSubmitting}
              className="w-full px-3 py-2 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
