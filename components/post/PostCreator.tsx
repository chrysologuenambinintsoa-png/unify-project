'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';

interface PostCreatorProps {
  onCreatePost: (post: Post) => void;
}

interface Post {
  id: string;
  content: string;
  images: string[];
  videos: string[];
  timestamp: Date;
}

export default function PostCreator({ onCreatePost }: PostCreatorProps) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const emojiTimerRef = useRef<NodeJS.Timeout | null>(null);

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

  const getUserInitial = () => {
    if (session?.user?.name) {
      return session.user.name.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const emojis = ['😀', '😂', '😍', '🥰', '😎', '🤔', '😢', '😡', '👍', '❤️', '🎉', '🔥', '✨', '💯', '🙌'];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('type', 'image');

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          const { urls } = data;
          if (urls && urls.length > 0) {
            setImages(prev => [...prev, ...urls]);
          }
          if (data.warnings && data.warnings.length > 0) {
            console.warn('Image upload warnings:', data.warnings);
          }
        } else {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: 'Failed to parse error response', status: response.status };
          }
          
          const errorMessage = errorData?.message || errorData?.error || 'Failed to upload images';
          const errorCode = errorData?.errorCode || 'UNKNOWN_ERROR';
          
          console.error('Error uploading images:', {
            message: errorMessage,
            errorCode,
            status: response.status,
            fullError: errorData
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Error uploading images:', {
          message: errorMessage,
          type: 'NetworkError'
        });
      }
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const formData = new FormData();
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
      formData.append('type', 'video');

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          const { urls } = data;
          if (urls && urls.length > 0) {
            setVideos(prev => [...prev, ...urls]);
          }
          if (data.warnings && data.warnings.length > 0) {
            console.warn('Video upload warnings:', data.warnings);
          }
        } else {
          let errorData;
          try {
            errorData = await response.json();
          } catch {
            errorData = { error: 'Failed to parse error response', status: response.status };
          }
          
          const errorMessage = errorData?.message || errorData?.error || 'Failed to upload videos';
          const errorCode = errorData?.errorCode || 'UNKNOWN_ERROR';
          
          console.error('Error uploading videos:', {
            message: errorMessage,
            errorCode,
            status: response.status,
            fullError: errorData
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error('Error uploading videos:', {
          message: errorMessage,
          type: 'NetworkError'
        });
      }
    }
  };

  const handleCreatePost = () => {
    if (!content.trim() && images.length === 0 && videos.length === 0) return;

    const newPost: Post = {
      id: Date.now().toString(),
      content,
      images,
      videos,
      timestamp: new Date(),
    };

    onCreatePost(newPost);
    setContent('');
    setImages([]);
    setVideos([]);
    closeEmojiPicker();
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      {/* User Info */}
      <div className="flex items-center mb-4 space-x-3">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 bg-primary-dark rounded-full flex items-center justify-center text-white font-bold text-lg border-2 border-accent-dark overflow-hidden flex-shrink-0">
            {session?.user?.image ? (
              <Image
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
          <p className="text-xs font-semibold text-gray-700 mt-1 truncate w-12 text-center">
            {session?.user?.name?.split(' ')[0] || 'User'}
          </p>
        </div>
        <textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="flex-1 bg-gray-100 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-dark resize-none"
        />
      </div>

      {/* Preview Images */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2 mb-4">
          {images.map((image, index) => (
            <div key={index} className="relative">
              <img src={image} alt={`Preview ${index}`} className="w-full h-40 object-cover rounded-lg" />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Preview Videos */}
      {videos.length > 0 && (
        <div className="space-y-2 mb-4">
          {videos.map((video, index) => (
            <div key={index} className="relative">
              <video src={video} controls className="w-full rounded-lg" />
              <button
                onClick={() => removeVideo(index)}
                className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="border rounded-lg p-3 mb-4 bg-white shadow-lg">
          <div className="grid grid-cols-8 gap-2">
            {emojis.map((emoji, index) => (
              <button
                key={index}
                onClick={() => handleEmojiSelect(emoji)}
                className="text-2xl hover:bg-gray-100 rounded p-1 transition"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-3 border-t">
        <div className="flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1 text-green-600 hover:bg-green-50 px-4 py-2 rounded-lg transition"
          >
            <span>📷</span>
            <span>Photo</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />

          <button
            onClick={() => videoInputRef.current?.click()}
            className="flex items-center space-x-1 text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition"
          >
            <span>🎥</span>
            <span>Video</span>
          </button>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleVideoUpload}
            className="hidden"
          />

          <button
            onClick={showEmojiPicker ? closeEmojiPicker : openEmojiPicker}
            className="flex items-center space-x-1 text-yellow-600 hover:bg-yellow-50 px-4 py-2 rounded-lg transition"
          >
            <span>😊</span>
            <span>Emoji</span>
          </button>
        </div>

        <button
          onClick={handleCreatePost}
          disabled={!content.trim() && images.length === 0 && videos.length === 0}
          className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed transition"
        >
          Post
        </button>
      </div>
    </div>
  );
}