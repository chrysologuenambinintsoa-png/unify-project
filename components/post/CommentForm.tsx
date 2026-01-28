'use client';

import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';

interface CommentFormProps {
  postId: string;
  onCommentAdded?: () => void;
}

export function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: content.trim() }),
      });

      if (response.ok) {
        setContent('');
        onCommentAdded?.();
      } else {
        console.error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) return null;

  return (
    <form onSubmit={handleSubmit} className="flex space-x-3 p-4 border-t border-gray-100">
      <Avatar
        src={session.user.avatar}
        name={session.user.fullName || session.user.username}
        size="sm"
      />
      <div className="flex-1 flex space-x-2">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Écrivez un commentaire..."
          className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          disabled={loading}
        />
        <Button
          type="submit"
          disabled={!content.trim() || loading}
          className="px-4 py-2 rounded-full"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}