'use client';

import { useState } from 'react';
import PostCreator from './PostCreator';
import TextPostCreator from './TextPostCreator';

interface UnifiedPostCreatorProps {
  onCreatePost: (post: any) => void;
}

export default function UnifiedPostCreator({ onCreatePost }: UnifiedPostCreatorProps) {
  const [activeTab, setActiveTab] = useState<'media' | 'text'>('media');

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md w-full overflow-hidden">
      {/* Tabs Navigation */}
      <div className="flex items-center border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('media')}
          className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'media'
              ? 'border-primary-dark text-gray-900 dark:text-white'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          📷 Photo/Vidéo
        </button>
        <button
          onClick={() => setActiveTab('text')}
          className={`flex-1 px-4 py-3 font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'text'
              ? 'border-primary-dark text-gray-900 dark:text-white'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          ✨ Texte stylisé
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'media' && (
          <PostCreator onCreatePost={onCreatePost} />
        )}
        {activeTab === 'text' && (
          <TextPostCreator onCreatePost={onCreatePost} />
        )}
      </div>
    </div>
  );
}
