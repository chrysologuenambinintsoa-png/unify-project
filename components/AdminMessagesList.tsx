'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Mail, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AdminMessage {
  id: string;
  subject: string;
  content: string;
  sender: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
  status: string;
  createdAt: string;
}

interface AdminMessagesListProps {
  pageId?: string;
  groupId?: string;
}

export function AdminMessagesList({ pageId, groupId }: AdminMessagesListProps) {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'unread' | 'read' | 'all'>('unread');

  useEffect(() => {
    fetchMessages();
  }, [pageId, groupId, filter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (pageId) params.append('pageId', pageId);
      if (groupId) params.append('groupId', groupId);
      params.append('status', filter === 'all' ? 'all' : filter);

      const res = await fetch(`/api/admin-messages?${params}`);
      if (!res.ok) throw new Error('Failed to fetch messages');

      const data = await res.json();
      setMessages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading messages');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const res = await fetch(`/api/admin-messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'read' }),
      });

      if (!res.ok) throw new Error('Failed to mark as read');
      fetchMessages();
    } catch (err) {
      console.error('Error marking message as read:', err);
    }
  };

  if (loading) return <div className="p-4">Loading messages...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Mail className="w-5 h-5 text-amber-500" />
          <h3 className="text-lg font-semibold">Messages from Members</h3>
        </div>
        <div className="flex gap-2">
          {(['unread', 'read', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 text-sm rounded-full transition ${
                filter === f
                  ? 'bg-amber-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg text-sm">{error}</div>}

      {messages.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <MessageSquare className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p>No messages</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {messages.map(message => (
            <div
              key={message.id}
              className={`p-4 rounded-lg border transition cursor-pointer ${
                message.status === 'unread'
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-gray-800/30 border-gray-700/50'
              }`}
              onClick={() => message.status === 'unread' && markAsRead(message.id)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {message.sender.avatar && (
                      <img
                        src={message.sender.avatar}
                        alt={message.sender.username}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <p className="font-medium">
                        {message.sender.fullName || message.sender.username}
                      </p>
                      <p className="text-xs text-gray-400">@{message.sender.username}</p>
                    </div>
                  </div>
                </div>
                {message.status === 'unread' && (
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-1" />
                )}
              </div>

              <h4 className="font-semibold mb-1">{message.subject}</h4>
              <p className="text-sm text-gray-300 mb-2">{message.content.substring(0, 100)}...</p>

              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {new Date(message.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
