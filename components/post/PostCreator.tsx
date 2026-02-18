'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import NextImage from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { X, Smile, MapPin, Users } from 'lucide-react';
import MediaUploadModal from './MediaUploadModal';

interface PostCreatorProps {
  onCreatePost: (post: Post) => void;
}

interface Post {
  id: string;
  content: string;
  images: string[];
  videos: string[];
  timestamp: Date;
  tags?: string[];
  emotion?: string;
  location?: string;
  isLive?: boolean;
}

export default function PostCreator({ onCreatePost }: PostCreatorProps) {
  const { data: session } = useSession();
  const { translation } = useLanguage();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [uploadingIndices, setUploadingIndices] = useState<Set<number>>(new Set());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [emotion, setEmotion] = useState('');
  const [location, setLocation] = useState('');
  const [tagSearchInput, setTagSearchInput] = useState('');
  const [isLive, setIsLive] = useState(false);
  const [friends, setFriends] = useState<string[]>([]);
  const [filteredFriends, setFilteredFriends] = useState<string[]>([]);
  const emojiTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Predefined emotions with emojis
  const emotionsList = [
    { emoji: '😊', label: 'Happy' },
    { emoji: '😢', label: 'Sad' },
    { emoji: '😡', label: 'Angry' },
    { emoji: '🤩', label: 'Excited' },
    { emoji: '😴', label: 'Tired' },
    { emoji: '🙏', label: 'Grateful' },
    { emoji: '🤔', label: 'Confused' },
    { emoji: '❤️', label: 'Loved' },
    { emoji: '💪', label: 'Motivated' },
    { emoji: '😎', label: 'Confident' },
  ];

  // Sample friends list (should be fetched from API)
  const sampleFriends = ['Alice Dupont', 'Bob Martin', 'Charlie Brown', 'Diana Prince', 'Eve Johnson', 'Frank Wilson', 'Grace Lee', 'Henry Davis', 'Iris Chen', 'Jack Smith'];

  // Fetch friends on component mount
  useEffect(() => {
    setFriends(sampleFriends);
  }, []);

  const openEmojiPicker = () => {
    setShowEmojiPicker(true);
    // Fermer après 3 secondes
    if (emojiTimerRef.current) clearTimeout(emojiTimerRef.current);
    emojiTimerRef.current = setTimeout(() => {
      setShowEmojiPicker(false);
    }, 3000);
  };

  const closeEmojiPicker = () => {
    setShowEmojiPicker(false);
    if (emojiTimerRef.current) clearTimeout(emojiTimerRef.current);
  };

  const handleEmojiSelect = (emoji: string) => {
    setContent(prev => prev + emoji);
    closeEmojiPicker();
  };

  // Handle friend search
  const handleTagSearchChange = (value: string) => {
    setTagSearchInput(value);
    if (value.trim()) {
      const filtered = friends.filter(friend =>
        friend.toLowerCase().includes(value.toLowerCase()) && !tags.includes(friend)
      );
      setFilteredFriends(filtered);
    } else {
      setFilteredFriends([]);
    }
  };

  // Add friend tag
  const addTag = (friend: string) => {
    if (!tags.includes(friend)) {
      setTags([...tags, friend]);
      setTagSearchInput('');
      setFilteredFriends([]);
    }
  };

  // Remove friend tag
  const removeTag = (friend: string) => {
    setTags(tags.filter(t => t !== friend));
  };

  const getUserInitial = () => {
    if (session?.user?.name) {
      return session.user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡', '👍', '❤️', '🎉', '🔥', '✨', '💯', '🙌'];

  const handleCreatePost = () => {
    if (!content.trim() && images.length === 0 && videos.length === 0) return;

    const newPost: Post = {
      id: Date.now().toString(),
      content,
      images,
      videos,
      timestamp: new Date(),
      tags,
      emotion,
      location,
      isLive,
    };

    onCreatePost(newPost);
    setContent('');
    setImages([]);
    setVideos([]);
    setTags([]);
    setEmotion('');
    setLocation('');
    setIsLive(false);
    setShowOptionsModal(false);
    closeEmojiPicker();
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg md:rounded-lg shadow-md p-3 md:p-4 mb-4 w-full">
      {/* User Info */}
      <div className="flex items-start mb-4 space-x-2 md:space-x-3 gap-2">
        <div className="flex flex-col items-center flex-shrink-0">
          <div className="w-10 md:w-12 h-10 md:h-12 bg-primary-dark rounded-full flex items-center justify-center text-white font-bold text-sm md:text-lg border-2 border-accent-dark overflow-hidden">
              {session?.user?.image ? (
              <NextImage
                src={session.user.image}
                alt={session?.user?.name || 'User'}
                width={48}
                height={48}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{session?.user?.name?.[0]?.toUpperCase() || 'U'}</span>
            )}
          </div>
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-400 mt-1 truncate w-10 md:w-12 text-center">
            {session?.user?.name?.split(' ')[0] || 'User'}
          </p>
        </div>
        <textarea
          placeholder={translation.post?.whatsOnMind || "What's on your mind?"}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-lg px-3 md:px-4 py-2 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-dark resize-none text-sm md:text-base min-h-[60px]"
        />
      </div>

      {/* Preview Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {images.map((image, index) => (
            <div key={index} className="relative w-full">
              <img 
                src={image} 
                alt={`Preview ${index}`} 
                className={`w-full h-32 md:h-40 object-cover rounded-lg transition-all duration-300 ${uploadingIndices.has(index) ? 'blur-sm opacity-60' : ''}`}
              />
              {uploadingIndices.has(index) && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-1"></div>
                    <p className="text-blue-500 text-xs font-semibold">Uploading...</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-100 text-sm"
                disabled={uploadingIndices.has(index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview Videos */}
      {videos.length > 0 && (
        <div className="space-y-2 mb-4 w-full">
          {videos.map((video, index) => (
            <div key={index} className="relative w-full">
              <video 
                src={video} 
                controls 
                className={`w-full rounded-lg max-h-64 md:max-h-80 transition-all duration-300 ${uploadingIndices.has(index + images.length) ? 'blur-sm opacity-60' : ''}`}
              />
              {uploadingIndices.has(index + images.length) && (
                <div className="absolute inset-0 top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-1"></div>
                    <p className="text-blue-500 text-xs font-semibold">Uploading...</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => removeVideo(index)}
                className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-100 text-sm"
                disabled={uploadingIndices.has(index + images.length)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Post Details Display */}
      {(isLive || emotion || location || tags.length > 0) && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4 text-sm">
          <div className="space-y-2">
            {isLive && (
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-semibold">
                <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></span>
                Going Live
              </div>
            )}
            {emotion && (
              <div className="flex items-center gap-2">
                <span>😊</span>
                <span className="text-gray-700 dark:text-gray-300">Feeling <strong>{emotion}</strong></span>
              </div>
            )}
            {location && (
              <div className="flex items-center gap-2">
                <span>📍</span>
                <span className="text-gray-700 dark:text-gray-300">at <strong>{location}</strong></span>
              </div>
            )}
            {tags.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span>👥</span>
                <span className="text-gray-700 dark:text-gray-300">with</span>
                {tags.map((tag, idx) => (
                  <span key={tag} className="bg-blue-200 dark:bg-blue-800 px-2 py-1 rounded text-xs font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="border rounded-lg p-3 mb-4 bg-white dark:bg-gray-800 shadow-lg dark:border-gray-700">
          <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiSelect(emoji)}
                className="text-lg md:text-2xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded p-1 transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-border">
        <div className="flex flex-wrap gap-1 sm:gap-2 w-full sm:w-auto">
          <button
            onClick={() => setShowMediaModal(true)}
            className="flex items-center space-x-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 sm:px-4 py-2 rounded-lg transition text-sm"
          >
            <span>📸</span>
            <span className="hidden sm:inline">Médias</span>
          </button>

          <button
            onClick={showEmojiPicker ? closeEmojiPicker : openEmojiPicker}
            className="flex items-center space-x-1 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 px-2 sm:px-4 py-2 rounded-lg transition text-sm"
          >
            <span>😊</span>
            <span className="hidden sm:inline">Emoji</span>
          </button>

          {/* Options Button */}
          <button
            onClick={() => setShowOptionsModal(true)}
            className="flex items-center space-x-1 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2 sm:px-4 py-2 rounded-lg transition text-sm"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">Options</span>
          </button>
        </div>

        <button
          onClick={handleCreatePost}
          disabled={!content.trim() && images.length === 0 && videos.length === 0}
          className="bg-primary text-white px-4 sm:px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition w-full sm:w-auto text-sm sm:text-base"
        >
          Post
        </button>
      </div>

      {/* Options Modal */}
      {showOptionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Post Options</h3>
              <button
                onClick={() => setShowOptionsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            {/* Live Toggle */}
            <div className="border-b dark:border-gray-700 pb-4">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-sm font-semibold flex items-center gap-2">
                  🔴 Go Live
                </span>
                <input
                  type="checkbox"
                  checked={isLive}
                  onChange={(e) => setIsLive(e.target.checked)}
                  className="w-5 h-5 rounded cursor-pointer"
                />
              </label>
              <p className="text-xs text-gray-500 mt-1">Share your moment with your audience in real-time</p>
            </div>

            {/* Feeling/Emotion */}
            <div>
              <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                <Smile size={16} /> Feeling
              </label>
              <div className="grid grid-cols-5 gap-2 mb-3">
                {emotionsList.map((emot) => (
                  <button
                    key={emot.label}
                    onClick={() => setEmotion(emot.label)}
                    className={`p-2 rounded-lg transition text-lg ${
                      emotion === emot.label
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    title={emot.label}
                  >
                    {emot.emoji}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Or type your feeling..."
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                <MapPin size={16} /> {translation.post?.location || 'Location'}
              </label>
              <input
                type="text"
                placeholder={translation.post?.locationPlaceholder || "Where are you? (e.g., Paris, France)"}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                autoComplete="off"
                className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700"
              />
              {/* Suggested locations */}
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  translation.locations?.paris || 'Paris',
                  translation.locations?.london || 'London',
                  translation.locations?.newYork || 'New York',
                  translation.locations?.tokyo || 'Tokyo',
                  translation.locations?.sydney || 'Sydney'
                ].map(loc => (
                  <button
                    key={loc}
                    onClick={() => setLocation(loc)}
                    className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  >
                    {loc}
                  </button>
                ))}
              </div>
            </div>

            {/* Identify/Tag People */}
            <div>
              <label className="block text-sm font-semibold mb-3 flex items-center gap-2">
                <Users size={16} /> Tag People
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search and add people..."
                  value={tagSearchInput}
                  onChange={(e) => handleTagSearchChange(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-gray-800 dark:text-white dark:border-gray-700 mb-3"
                  autoComplete="off"
                />
                {/* Dropdown suggestions */}
                {filteredFriends.length > 0 && (
                  <div className="absolute top-11 left-0 right-0 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
                    {filteredFriends.map(friend => (
                      <button
                        key={friend}
                        onClick={() => addTag(friend)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition"
                      >
                        {friend}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Tagged people chips */}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <span
                      key={tag}
                      className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:text-blue-900 dark:hover:text-blue-300 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg text-sm">
              <p className="font-semibold mb-2">Post Summary:</p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                {isLive && <li>✓ Going Live</li>}
                {emotion && <li>✓ Feeling: {emotion}</li>}
                {location && <li>✓ Location: {location}</li>}
                {tags.length > 0 && <li>✓ With {tags.length} person{tags.length > 1 ? 's' : ''}</li>}
              </ul>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowOptionsModal(false)}
              className="w-full bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Media Upload Modal */}
      <MediaUploadModal
        isOpen={showMediaModal}
        onClose={() => setShowMediaModal(false)}
        onImagesUpload={(imgs) => setImages(imgs)}
        onVideosUpload={(vids) => setVideos(vids)}
        images={images}
        videos={videos}
      />
    </div>
  );
}
