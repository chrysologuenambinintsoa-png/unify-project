'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

interface CreateStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { text?: string; imageUrl?: string; videoUrl?: string }) => Promise<void>;
}

export default function CreateStoryModal({ isOpen, onClose, onCreate }: CreateStoryModalProps) {
  const { data: session } = useSession();
  const { translation } = useLanguage();
  const [formData, setFormData] = useState({ text: '', imageUrl: '', videoUrl: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.text.trim() && !formData.imageUrl.trim() && !formData.videoUrl.trim()) {
      setError(translation.story?.atLeastOneRequired || 'At least text or media is required');
      return;
    }
    try {
      setLoading(true);
      await onCreate(formData);
      setFormData({ text: '', imageUrl: '', videoUrl: '' });
      setError('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : translation.errors?.saveError || 'Failed to create story');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {session && (session?.user?.image || (session?.user as any)?.avatar) && (
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-blue-500 flex-shrink-0">
                <Image
                  src={session.user.image || (session?.user as any)?.avatar}
                  alt={session.user.name || 'User'}
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              </div>
            )}
            {session && !(session?.user?.image || (session?.user as any)?.avatar) && (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
                {(session?.user?.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold">{session?.user?.name || translation.story?.createStory || 'Create story'}</h2>
              <p className="text-xs text-gray-500">{translation.story?.yourStory || 'Your story'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X size={20} />
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{translation.story?.text || 'Text'}</label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              placeholder={translation.post?.whatsOnMind || "What's on your mind?"}
              disabled={loading}
              className="w-full p-2 border border-gray-300 rounded text-sm"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{translation.story?.imageUrl || 'Image URL (optional)'}</label>
            <Input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{translation.story?.videoUrl || 'Video URL (optional)'}</label>
            <Input
              type="url"
              value={formData.videoUrl}
              onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
              placeholder="https://example.com/video.mp4"
              disabled={loading}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              {translation.common?.cancel || 'Cancel'}
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? translation.messages?.sendingComment || 'Creating...' : translation.story?.createStory || 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
