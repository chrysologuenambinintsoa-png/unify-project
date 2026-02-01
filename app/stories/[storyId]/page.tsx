'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

interface Story {
  id: string;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  createdAt: string;
  user?: { id: string; username: string; fullName: string; avatar?: string };
  comments?: Array<{ id: string; content: string; user: { id: string; fullName: string; avatar?: string }; createdAt: string }>;
}

export default function StoryDetailPage() {
  const params = useParams();
  const storyId = params.storyId as string;
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const res = await fetch(`/api/stories/${storyId}`);
        if (!res.ok) throw new Error('Failed to fetch story');
        const data = await res.json();
        setStory(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load story');
      } finally {
        setLoading(false);
      }
    };

    if (storyId) fetchStory();
  }, [storyId]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!story) return <div className="p-6 text-center">Story not found</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Story Media */}
        {(story.imageUrl || story.videoUrl) && (
          <div className="relative h-96 w-full">
            <Image src={story.imageUrl || story.videoUrl || ''} alt="Story" fill className="object-cover" />
          </div>
        )}

        {/* Story Content */}
        <div className="p-6">
          <div></div>

          {/* Author Info */}
          {story.user && (
            <div className="flex items-center gap-3 mb-6 pb-6 border-b">
              {story.user.avatar && (
                <Image src={story.user.avatar} alt={story.user.fullName} width={48} height={48} className="rounded-full" />
              )}
              <div>
                <p className="font-semibold">{story.user.fullName}</p>
                <p className="text-sm text-gray-500">@{story.user.username}</p>
                <p className="text-xs text-gray-400">{new Date(story.createdAt).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Story Body */}
          <div className="prose prose-sm max-w-none mb-6">
            <p className="text-gray-800 whitespace-pre-wrap">{story.text || 'No text'}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 border-t pt-4 mb-6">
            <button className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors">
              <Heart size={20} />
              <span>Like</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors">
              <MessageCircle size={20} />
              <span>Comment</span>
            </button>
            <button className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors">
              <Share2 size={20} />
              <span>Share</span>
            </button>
          </div>

          {/* Comments Section */}
          {story.comments && story.comments.length > 0 && (
            <div>
              <h3 className="font-bold mb-4">Comments ({story.comments.length})</h3>
              <div className="space-y-4">
                {story.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 pb-4 border-b last:border-b-0">
                    {comment.user.avatar && (
                      <Image src={comment.user.avatar} alt={comment.user.fullName} width={36} height={36} className="rounded-full" />
                    )}
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{comment.user.fullName}</p>
                      <p className="text-sm text-gray-800 mt-1">{comment.content}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(comment.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
