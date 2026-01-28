'use client';

import React, { useState, useEffect } from 'react';
import { Plus, X, Eye, Heart, MessageCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface Story {
  id: string;
  imageUrl?: string;
  videoUrl?: string;
  text?: string;
  createdAt: string;
  expiresAt: string;
  isViewed: boolean;
  viewCount: number;
  reactionCount: number;
  reactions: Array<{
    emoji: string;
    user: {
      username: string;
    };
  }>;
}

interface UserStories {
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  stories: Story[];
}

interface StoriesProps {
  compact?: boolean;
}

export function Stories({ compact = false }: StoriesProps) {
  const [stories, setStories] = useState<UserStories[]>([]);
  const [selectedUserStories, setSelectedUserStories] = useState<UserStories | null>(null);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/stories');
      if (response.ok) {
        const data = await response.json();
        setStories(data);
      }
    } catch (error) {
      console.error('Error fetching stories:', error);
    } finally {
      setLoading(false);
    }
  };

  const openStoryViewer = (userStories: UserStories) => {
    setSelectedUserStories(userStories);
    setCurrentStoryIndex(0);
  };

  const closeStoryViewer = () => {
    setSelectedUserStories(null);
    setCurrentStoryIndex(0);
  };

  const nextStory = () => {
    if (selectedUserStories) {
      if (currentStoryIndex < selectedUserStories.stories.length - 1) {
        setCurrentStoryIndex(currentStoryIndex + 1);
      } else {
        // Move to next user's stories
        const currentUserIndex = stories.findIndex(s => s.user.id === selectedUserStories.user.id);
        if (currentUserIndex < stories.length - 1) {
          setSelectedUserStories(stories[currentUserIndex + 1]);
          setCurrentStoryIndex(0);
        } else {
          closeStoryViewer();
        }
      }
    }
  };

  const prevStory = () => {
    if (selectedUserStories) {
      if (currentStoryIndex > 0) {
        setCurrentStoryIndex(currentStoryIndex - 1);
      } else {
        // Move to previous user's stories
        const currentUserIndex = stories.findIndex(s => s.user.id === selectedUserStories.user.id);
        if (currentUserIndex > 0) {
          const prevUserStories = stories[currentUserIndex - 1];
          setSelectedUserStories(prevUserStories);
          setCurrentStoryIndex(prevUserStories.stories.length - 1);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex space-x-4 p-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex flex-col items-center space-y-2">
            <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="w-12 h-3 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  if (stories.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Aucune story disponible</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 p-4">
        {/* Create Story Card */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex flex-col items-center space-y-3 cursor-pointer"
          onClick={() => setShowCreateModal(true)}
        >
          <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center border-2 border-dashed border-gray-300 hover:border-primary-dark transition-all duration-300 shadow-lg hover:shadow-xl">
            <Plus className="w-8 h-8 text-gray-500" />
          </div>
          <span className="text-sm font-medium text-gray-700 text-center">Créer une story</span>
        </motion.div>

        {/* User Stories Cards */}
        {stories.map((userStories) => (
          <motion.div
            key={userStories.user.id}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            className="flex flex-col items-center space-y-3 cursor-pointer"
            onClick={() => openStoryViewer(userStories)}
          >
            <div className={`relative w-20 h-20 rounded-2xl p-1 ${userStories.stories.some(s => !s.isViewed) ? 'bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500' : 'bg-gradient-to-tr from-gray-300 to-gray-400'} shadow-lg hover:shadow-xl transition-all duration-300`}>
              <div className="w-full h-full bg-white rounded-xl overflow-hidden">
                <Avatar
                  src={userStories.user.avatar}
                  name={userStories.user.fullName || userStories.user.username}
                  size="sm"
                  className="w-full h-full rounded-xl"
                />
              </div>
              {/* Story indicator */}
              {userStories.stories.some(s => !s.isViewed) && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              )}
            </div>
            <span className="text-sm font-medium text-gray-700 text-center max-w-20 truncate">
              {userStories.user.username}
            </span>
          </motion.div>
        ))}
      </div>

      {/* Story Viewer Modal */}
      <AnimatePresence>
        {selectedUserStories && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center"
            onClick={closeStoryViewer}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="relative max-w-md w-full mx-4 bg-black rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/50 to-transparent">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={selectedUserStories.user.avatar}
                      name={selectedUserStories.user.fullName || selectedUserStories.user.username}
                      size="sm"
                    />
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {selectedUserStories.user.fullName || selectedUserStories.user.username}
                      </p>
                      <p className="text-white/70 text-xs">
                        {new Date(selectedUserStories.stories[currentStoryIndex].createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={closeStoryViewer}
                    className="text-white hover:text-gray-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="absolute top-2 left-2 right-2 z-10 flex space-x-1">
                {selectedUserStories.stories.map((_, index) => (
                  <div key={index} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: index <= currentStoryIndex ? '100%' : '0%' }}
                      transition={{ duration: index === currentStoryIndex ? 5 : 0 }}
                      className="h-full bg-white"
                    />
                  </div>
                ))}
              </div>

              {/* Story Content */}
              <div className="aspect-[9/16] relative">
                {selectedUserStories.stories[currentStoryIndex].imageUrl && (
                  <img
                    src={selectedUserStories.stories[currentStoryIndex].imageUrl}
                    alt="Story"
                    className="w-full h-full object-cover"
                  />
                )}
                {selectedUserStories.stories[currentStoryIndex].videoUrl && (
                  <video
                    src={selectedUserStories.stories[currentStoryIndex].videoUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    onEnded={nextStory}
                  />
                )}
                {selectedUserStories.stories[currentStoryIndex].text && (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500">
                    <p className="text-white text-xl font-semibold text-center px-4">
                      {selectedUserStories.stories[currentStoryIndex].text}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/50 to-transparent">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">{selectedUserStories.stories[currentStoryIndex].viewCount}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span className="text-sm">{selectedUserStories.stories[currentStoryIndex].reactionCount}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {selectedUserStories.stories[currentStoryIndex].reactions.slice(0, 3).map((reaction, index) => (
                      <span key={index} className="text-sm">{reaction.emoji}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation Areas */}
              <div className="absolute inset-y-0 left-0 w-1/2 cursor-pointer" onClick={prevStory} />
              <div className="absolute inset-y-0 right-0 w-1/2 cursor-pointer" onClick={nextStory} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Story Modal - Placeholder for now */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold mb-4">Créer une story</h3>
              <p className="text-gray-600 mb-4">Fonctionnalité à venir...</p>
              <Button onClick={() => setShowCreateModal(false)} className="w-full">
                Fermer
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}