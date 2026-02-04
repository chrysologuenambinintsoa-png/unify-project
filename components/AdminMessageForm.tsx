'use client';

import React, { useState } from 'react';
import { Send, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AdminMessageFormProps {
  pageId?: string;
  groupId?: string;
  onMessageSent?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export function AdminMessageForm({
  pageId,
  groupId,
  onMessageSent,
  isOpen = true,
  onClose,
}: AdminMessageFormProps) {
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!subject.trim() || !content.trim()) {
      setError('Subject and message are required');
      return;
    }

    if (!pageId && !groupId) {
      setError('Invalid page or group');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/admin-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pageId,
          groupId,
          subject,
          content,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);
      setSubject('');
      setContent('');
      onMessageSent?.();

      setTimeout(() => {
        setSuccess(false);
        onClose?.();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error sending message');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-amber-500/20 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-amber-500/10">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-bold">Contact Admin</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-500/20 text-red-300 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 text-green-300 p-3 rounded-lg text-sm">
              Message sent successfully!
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subject
            </label>
            <input
              type="text"
              placeholder="Message subject..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-gray-800 border border-amber-500/30 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-amber-500"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Message
            </label>
            <textarea
              placeholder="Your message..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-gray-800 border border-amber-500/30 text-white px-4 py-2 rounded-lg focus:outline-none focus:border-amber-500 resize-none h-32"
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Sending...' : 'Send Message'}</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="w-full"
          >
            Cancel
          </Button>
        </form>
      </div>
    </div>
  );
}
