'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import NextImage from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';

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
  const { translation } = useLanguage();
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
      // Get image dimensions
      const getImageDimensions = async (file: File): Promise<{ width: number; height: number }> => {
        return await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const img = new Image();
            img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = String(reader.result);
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });
      };

      // Auto-resize image if dimensions exceed 1024x1024 while maintaining aspect ratio
      const resizeImageIfNeeded = async (file: File): Promise<File> => {
        try {
          const dims = await getImageDimensions(file);
          const MAX_DIM = 1024;

          if (dims.width <= MAX_DIM && dims.height <= MAX_DIM) {
            return file;
          }

          // Calculate new dimensions maintaining aspect ratio
          let newWidth = dims.width;
          let newHeight = dims.height;

          if (dims.width > MAX_DIM || dims.height > MAX_DIM) {
            const aspectRatio = dims.width / dims.height;
            if (dims.width > dims.height) {
              newWidth = MAX_DIM;
              newHeight = Math.round(MAX_DIM / aspectRatio);
            } else {
              newHeight = MAX_DIM;
              newWidth = Math.round(MAX_DIM * aspectRatio);
            }
          }

          // Resize using canvas
          return await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const img = new Image();
              img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = newWidth;
                canvas.height = newHeight;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                  reject(new Error('Failed to get canvas context'));
                  return;
                }
                ctx.drawImage(img, 0, 0, newWidth, newHeight);
                canvas.toBlob(
                  (blob) => {
                    if (!blob) {
                      reject(new Error('Failed to create blob'));
                      return;
                    }
                    const resizedFile = new File([blob], file.name, {
                      type: 'image/jpeg',
                      lastModified: Date.now(),
                    });
                    resolve(resizedFile);
                  },
                  'image/jpeg',
                  0.95
                );
              };
              img.onerror = () => reject(new Error('Failed to load image'));
              img.src = String(reader.result);
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
          });
        } catch (err) {
          console.error('Error resizing image:', err);
          return file;
        }
      };

      // Process all files with auto-resize
      const validFiles: File[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          const resized = await resizeImageIfNeeded(file);
          validFiles.push(resized);
        } catch (err) {
          console.warn('Failed to process image, using original:', file.name, err);
          validFiles.push(file);
        }
      }

      if (validFiles.length === 0) return;

      const formData = new FormData();
      validFiles.forEach(file => formData.append('files', file));
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
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes
      
      // Validate file sizes
      for (let i = 0; i < files.length; i++) {
        if (files[i].size > MAX_FILE_SIZE) {
          alert(`Video "${files[i].name}" exceeds the 10MB size limit`);
          return;
        }
      }
      
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
              <img src={image} alt={`Preview ${index}`} className="w-full h-32 md:h-40 object-cover rounded-lg" />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 bg-gray-800 bg-opacity-70 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-opacity-100 text-sm"
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
              <video src={video} controls className="w-full rounded-lg max-h-64 md:max-h-80" />
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
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center space-x-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 px-2 sm:px-4 py-2 rounded-lg transition text-sm"
          >
            <span>📷</span>
            <span className="hidden sm:inline">Photo</span>
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
            className="flex items-center space-x-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 sm:px-4 py-2 rounded-lg transition text-sm"
          >
            <span>🎥</span>
            <span className="hidden sm:inline">Video</span>
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
            className="flex items-center space-x-1 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 px-2 sm:px-4 py-2 rounded-lg transition text-sm"
          >
            <span>😊</span>
            <span className="hidden sm:inline">Emoji</span>
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
    </div>
  );
}
