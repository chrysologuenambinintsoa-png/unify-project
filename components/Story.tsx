 'use client';

import { useState, useRef, useEffect } from 'react';
import { Avatar } from '@/components/ui/Avatar';

interface StoryProps {
  story: Story;
  isUserStory?: boolean;
  onViewStory?: (story: Story) => void;
  onCreateStory?: () => void;
}

interface Story {
  id: string;
  user: {
    name: string;
    avatar: string;
  };
  image?: string;
  imageUrl?: string;
  video?: string;
  videoUrl?: string;
  text?: string;
  timestamp: Date;
  viewed?: boolean;
}

export default function Story({ story, isUserStory = false, onViewStory, onCreateStory }: StoryProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleView = () => {
    if (isUserStory && onCreateStory) {
      onCreateStory();
    } else if (onViewStory) {
      onViewStory(story);
    }
  };

  return (
    <div
      className="flex-shrink-0 w-24 sm:w-28 md:w-32 h-44 sm:h-52 md:h-56 mx-2 cursor-pointer relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleView}
    >
      {/* Story Border Ring - Logo Colors (Primary/Accent) */}
      <div className={`absolute inset-0 rounded-xl p-0.5 ${story.viewed && !isUserStory ? 'bg-gray-300' : 'bg-gradient-to-tr from-accent via-primary to-accent-dark'}`}>
        <div className="relative w-full h-full bg-gray-200 rounded-xl overflow-hidden flex items-stretch">
          {story.image ? (
            <img src={(story as any).image || (story as any).imageUrl} alt={story.user.name} className={`w-full h-full object-cover ${isHovered ? 'scale-105' : 'scale-100'} transition-transform duration-300`} />
          ) : story.video ? (
            <video src={(story as any).video || (story as any).videoUrl} className={`w-full h-full object-cover ${isHovered ? 'scale-105' : 'scale-100'} transition-transform duration-300`} />
          ) : story.text ? (
            <div className="w-full h-full flex items-center justify-center p-4 text-center bg-gradient-to-br from-primary via-accent to-accent-dark">
              <div className="text-base font-bold text-white break-words">{story.text}</div>
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-accent via-primary to-accent-dark" />
          )}

          {isUserStory && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex flex-col items-center justify-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary rounded-full flex items-center justify-center text-white text-xl sm:text-2xl mb-2 border-4 border-white">+</div>
              <span className="text-white text-xs sm:text-sm font-semibold text-center px-2">Créer</span>
            </div>
          )}

          {!isUserStory && (
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
          )}
        </div>
      </div>

      {/* User Avatar */}
      {!isUserStory && (
        <div className="absolute -top-1 -left-1 w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-white overflow-hidden">
            <Avatar src={story.user?.avatar || null} name={story.user?.name} size="sm" className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
      )}

      {/* User Name */}
      {!isUserStory && (
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-white text-xs sm:text-sm font-semibold truncate">{story.user?.name}</p>
        </div>
      )}

      {/* Hover Effect */}
      {isHovered && !isUserStory && (
        <div className="absolute inset-0 bg-black bg-opacity-20 rounded-xl transition-opacity duration-300" />
      )}
    </div>
  );
}