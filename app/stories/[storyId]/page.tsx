'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, MessageCircle, Share2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { motion } from 'framer-motion';

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
  const router = useRouter();
  const storyId = params.storyId as string;
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

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

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(prev => liked ? Math.max(0, prev - 1) : prev + 1);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/95 flex flex-col items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-4">{error || 'Story non trouvée'}</p>
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-blue-400 hover:text-blue-300 mx-auto"
          >
            <ChevronLeft size={20} />
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col overflow-hidden"
    >
      {/* Close Button */}
      <button 
        onClick={() => router.back()} 
        className="fixed top-4 right-4 md:top-6 md:right-6 z-[10002] text-white p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all hover:scale-110"
        aria-label="Close"
      >
        <X size={24} />
      </button>

      {/* Content - Responsive layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Media */}
        <div className="flex-1 md:w-2/3 flex items-center justify-center relative p-2 md:p-4">
          <div className="w-full h-full flex items-center justify-center">
            {story.imageUrl || story.videoUrl ? (
              story.imageUrl ? (
                <img src={story.imageUrl} alt="Story" className="max-w-full max-h-full object-contain rounded" />
              ) : (
                <video src={story.videoUrl} controls className="max-w-full max-h-full object-contain rounded" />
              )
            ) : (
              <div className="text-white text-center">
                <p>Aucun média disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Info Panel */}
        <motion.aside 
          initial={{ x: 120, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-full md:w-1/3 bg-white dark:bg-gray-900 flex flex-col border-t md:border-t-0 md:border-l border-gray-200 h-1/2 md:h-auto overflow-y-auto"
        >
          {/* Author Info */}
          {story.user && (
            <div className="flex items-center gap-3 p-3 md:p-4 border-b">
              <button 
                onClick={() => router.back()} 
                className="md:hidden text-gray-500 hover:text-gray-700 p-1 flex-shrink-0"
              >
                <X size={20} />
              </button>
              <Avatar src={story.user.avatar} name={story.user.fullName} userId={story.user.id} size="sm" className="w-8 h-8 md:w-10 md:h-10 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xs md:text-sm truncate">{story.user.fullName}</p>
                <p className="text-xs text-gray-500">@{story.user.username}</p>
                <p className="text-xs text-gray-400 hidden md:block">{new Date(story.createdAt).toLocaleString()}</p>
              </div>
            </div>
          )}

          {/* Story Text */}
          {story.text && (
            <div className="px-3 md:px-4 py-2 md:py-3 border-b">
              <p className="text-xs md:text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{story.text}</p>
            </div>
          )}

          {/* Like Count */}
          <div className="px-3 md:px-4 py-2 text-xs text-gray-500">
            {likeCount} j'aime
          </div>

          {/* Action Buttons */}
          <div className="px-3 md:px-4 py-2 md:py-3 border-b flex gap-2">
            <button 
              onClick={handleLike}
              className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg transition-colors text-xs md:text-sm font-medium ${
                liked 
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
                  : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
              <span className="hidden sm:inline">J'aime</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs md:text-sm font-medium">
              <MessageCircle size={16} />
              <span className="hidden sm:inline">Commenter</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs md:text-sm font-medium">
              <Share2 size={16} />
              <span className="hidden sm:inline">Partager</span>
            </button>
          </div>

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto px-3 md:px-4 py-2 md:py-3 space-y-3">
            {story.comments && story.comments.length > 0 ? (
              <>
                <h3 className="font-bold text-xs md:text-sm">Commentaires ({story.comments.length})</h3>
                {story.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2 pb-3 border-b last:border-b-0">
                    <Avatar src={comment.user.avatar} name={comment.user.fullName} userId={comment.user.id} size="sm" className="w-6 h-6 md:w-8 md:h-8 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs md:text-sm">{comment.user.fullName}</p>
                      <p className="text-xs text-gray-700 dark:text-gray-300 mt-0.5">{comment.content}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{new Date(comment.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <p className="text-xs text-gray-500 text-center py-4">Aucun commentaire</p>
            )}
          </div>
        </motion.aside>
      </div>
    </motion.div>
  );
}
