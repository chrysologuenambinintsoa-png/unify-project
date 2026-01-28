'use client';

import React, { useState, useRef } from 'react';
import { Image, Video, X, Smile, MoreHorizontal } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const backgrounds = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
];

export function CreatePost() {
  const { data: session } = useSession();
  const { translation } = useLanguage();
  const [content, setContent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const [selectedBackground, setSelectedBackground] = useState<string | undefined>();
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && images.length === 0 && videos.length === 0) return;

    try {
      const media = [
        ...images.map(url => ({ type: 'image', url })),
        ...videos.map(url => ({ type: 'video', url })),
      ];

      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          background: selectedBackground,
          media: media.length > 0 ? media : undefined,
        }),
      });

      if (response.ok) {
        // Reset form
        setContent('');
        setImages([]);
        setVideos([]);
        setSelectedBackground(undefined);
        setShowBackgroundPicker(false);
        // TODO: Refresh posts list or emit event to parent
      } else {
        console.error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleRemoveVideo = (index: number) => {
    setVideos(videos.filter((_, i) => i !== index));
  };

  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'unify_uploads');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Cloudinary upload error:', errorData);
      throw new Error(`Failed to upload file: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    return data.secure_url;
  };

  const handleImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          throw new Error('Only image files are allowed');
        }
        // Validate file size (max 10MB per image)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error('File size must be less than 10MB');
        }
        return uploadToCloudinary(file);
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setImages(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading images:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload images');
    } finally {
      setIsUploading(false);
      // Reset input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleVideoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Validate file type
        if (!file.type.startsWith('video/')) {
          throw new Error('Only video files are allowed');
        }
        // Validate file size (max 50MB per video)
        if (file.size > 50 * 1024 * 1024) {
          throw new Error('File size must be less than 50MB');
        }
        return uploadToCloudinary(file);
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      setVideos(prev => [...prev, ...uploadedUrls]);
    } catch (error) {
      console.error('Error uploading videos:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload videos');
    } finally {
      setIsUploading(false);
      // Reset input
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="mb-6">
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <div className="flex items-start space-x-4">
              <Avatar
                src={session?.user?.avatar}
                name={session?.user?.fullName || session?.user?.username}
                size="lg"
              />
              <div className="flex-1">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={translation.post.whatsOnMind}
                  className="w-full min-h-[100px] p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-primary-dark focus:border-transparent"
                  style={{
                    backgroundImage: selectedBackground,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
              </div>
            </div>

            {/* Images Preview */}
            <AnimatePresence>
              {images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 grid grid-cols-2 gap-2"
                >
                  {images.map((img, index) => (
                    <div key={index} className="relative">
                      <img
                        src={img}
                        alt={`Upload ${index}`}
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Videos Preview */}
            <AnimatePresence>
              {videos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 space-y-2"
                >
                  {videos.map((video, index) => (
                    <div key={index} className="relative">
                      <video
                        src={video}
                        controls
                        className="w-full max-h-64 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(index)}
                        className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Background Picker */}
          <AnimatePresence>
            {showBackgroundPicker && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="px-4 pb-4 border-b border-gray-100"
              >
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {backgrounds.map((bg, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedBackground(selectedBackground === bg ? undefined : bg);
                        setShowBackgroundPicker(false);
                      }}
                      className={cn(
                        'w-16 h-16 rounded-lg flex-shrink-0 border-2 transition-all',
                        selectedBackground === bg ? 'border-accent-dark ring-2 ring-accent-dark' : 'border-gray-200'
                      )}
                      style={{ background: bg }}
                    />
                  ))}
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSelectedBackground(undefined);
                      setShowBackgroundPicker(false);
                    }}
                    className={cn(
                      'w-16 h-16 rounded-lg flex-shrink-0 border-2 bg-white transition-all flex items-center justify-center',
                      !selectedBackground ? 'border-accent-dark ring-2 ring-accent-dark' : 'border-gray-200'
                    )}
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="p-4 border-t border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Image className="w-5 h-5 text-green-600 mr-2" />
                  <span className="hidden sm:inline">{translation.post.addImage}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => videoInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Video className="w-5 h-5 text-blue-600 mr-2" />
                  <span className="hidden sm:inline">{translation.post.addVideo}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
                >
                  <MoreHorizontal className="w-5 h-5 text-purple-600 mr-2" />
                  <span className="hidden sm:inline">{translation.post.background}</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                >
                  <Smile className="w-5 h-5 text-yellow-600 mr-2" />
                </Button>
              </div>
              <Button type="submit" disabled={!content.trim() && images.length === 0 && videos.length === 0 || isUploading}>
                {isUploading ? 'Téléchargement...' : translation.post.post}
              </Button>
            </div>
          </div>
        </form>

        {/* Hidden file inputs */}
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="hidden"
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={handleVideoSelect}
          className="hidden"
        />
      </Card>
    </motion.div>
  );
}