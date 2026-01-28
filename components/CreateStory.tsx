'use client';

import React, { useState, useRef } from 'react';
import { Image, Video, X, Smile, Plus, Camera, Type, Palette } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const storyBackgrounds = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #d299c2 0%, #fef9d7 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 50%, #4facfe 100%)',
  '#000000',
  '#ffffff',
];

interface CreateStoryProps {
  onStoryCreated?: () => void;
}

export function CreateStory({ onStoryCreated }: CreateStoryProps) {
  const { data: session } = useSession();
  const { translation } = useLanguage();
  const [content, setContent] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedBackground, setSelectedBackground] = useState<string | undefined>();
  const [storyType, setStoryType] = useState<'text' | 'image' | 'video' | null>(null);
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showCreateOptions, setShowCreateOptions] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
        setSelectedVideo(null);
        setStoryType('image');
        setShowCreateOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 50 * 1024 * 1024) { // 50MB max
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedVideo(e.target?.result as string);
        setSelectedImage(null);
        setStoryType('video');
        setShowCreateOptions(false);
      };
      reader.readAsDataURL(file);
    } else {
      alert('La vidéo ne doit pas dépasser 50MB');
    }
  };

  const handleTextStory = () => {
    setStoryType('text');
    setSelectedImage(null);
    setSelectedVideo(null);
    setShowCreateOptions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !selectedImage && !selectedVideo) return;

    try {
      setIsUploading(true);

      const storyData = {
        content: content.trim(),
        image: selectedImage,
        video: selectedVideo,
        background: selectedBackground,
        type: storyType,
      };

      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(storyData),
      });

      if (response.ok) {
        // Reset form
        setContent('');
        setSelectedImage(null);
        setSelectedVideo(null);
        setSelectedBackground(undefined);
        setStoryType(null);
        setShowCreateOptions(false);
        onStoryCreated?.();
      }
    } catch (error) {
      console.error('Erreur lors de la création de la story:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const removeMedia = () => {
    setSelectedImage(null);
    setSelectedVideo(null);
    setStoryType(null);
  };

  if (!session) return null;

  return (
    <Card className="p-4 mb-6">
      <div className="flex items-center space-x-3 mb-4">
        <Avatar src={session.user?.image} alt={session.user?.name || undefined} size="sm" />
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            {session.user?.name}
          </p>
          <p className="text-xs text-gray-500">Créer une story</p>
        </div>
      </div>

      {/* Story Preview */}
      <AnimatePresence>
        {(storyType === 'text' || selectedImage || selectedVideo) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mb-4"
          >
            <div
              className="relative w-full h-64 rounded-xl overflow-hidden flex items-center justify-center text-white"
              style={{
                background: selectedBackground || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              }}
            >
              {selectedImage && (
                <img
                  src={selectedImage}
                  alt="Story"
                  className="w-full h-full object-cover"
                />
              )}
              {selectedVideo && (
                <video
                  src={selectedVideo}
                  className="w-full h-full object-cover"
                  controls
                />
              )}
              {storyType === 'text' && !selectedImage && !selectedVideo && (
                <div className="text-center p-4">
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Écrivez quelque chose..."
                    className="w-full bg-transparent text-white placeholder-white/70 text-xl font-medium text-center resize-none border-none outline-none"
                    rows={4}
                  />
                </div>
              )}

              {(selectedImage || selectedVideo) && (
                <div className="absolute top-2 left-2 right-2 flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Avatar src={session.user?.image} alt={session.user?.name || undefined} size="sm" />
                    <span className="text-white text-sm font-medium">
                      {session.user?.name}
                    </span>
                  </div>
                  <Button
                    onClick={removeMedia}
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {storyType === 'text' && !selectedImage && !selectedVideo && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex justify-center space-x-2 mb-2">
                    {storyBackgrounds.map((bg, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedBackground(bg)}
                        className={cn(
                          "w-6 h-6 rounded-full border-2 border-white",
                          selectedBackground === bg ? "border-white" : "border-white/50"
                        )}
                        style={{ background: bg }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Options */}
      {!storyType && (
        <div className="space-y-3">
          <div className="flex items-center justify-center space-x-4">
            <Button
              onClick={() => setShowCreateOptions(!showCreateOptions)}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Créer une story</span>
            </Button>
          </div>

          <AnimatePresence>
            {showCreateOptions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-center space-x-4 pt-2"
              >
                <Button
                  onClick={handleTextStory}
                  variant="ghost"
                  className="flex flex-col items-center space-y-1 p-3"
                >
                  <Type className="w-5 h-5 text-blue-500" />
                  <span className="text-xs">Texte</span>
                </Button>

                <Button
                  onClick={() => imageInputRef.current?.click()}
                  variant="ghost"
                  className="flex flex-col items-center space-y-1 p-3"
                >
                  <Camera className="w-5 h-5 text-green-500" />
                  <span className="text-xs">Photo</span>
                </Button>

                <Button
                  onClick={() => videoInputRef.current?.click()}
                  variant="ghost"
                  className="flex flex-col items-center space-y-1 p-3"
                >
                  <Video className="w-5 h-5 text-red-500" />
                  <span className="text-xs">Vidéo</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Action Buttons */}
      {storyType && (
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => imageInputRef.current?.click()}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Image className="w-4 h-4" />
              <span>Photo</span>
            </Button>

            <Button
              onClick={() => videoInputRef.current?.click()}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-1"
            >
              <Video className="w-4 h-4" />
              <span>Vidéo</span>
            </Button>

            {storyType === 'text' && (
              <Button
                onClick={() => setShowBackgroundPicker(!showBackgroundPicker)}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-1"
              >
                <Palette className="w-4 h-4" />
                <span>Fond</span>
              </Button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => {
                setContent('');
                setSelectedImage(null);
                setSelectedVideo(null);
                setSelectedBackground(undefined);
                setStoryType(null);
              }}
              variant="ghost"
              size="sm"
            >
              Annuler
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={isUploading || (!content.trim() && !selectedImage && !selectedVideo)}
              size="sm"
            >
              {isUploading ? 'Publication...' : 'Publier'}
            </Button>
          </div>
        </div>
      )}

      {/* Background Picker */}
      <AnimatePresence>
        {showBackgroundPicker && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex flex-wrap gap-2">
              {storyBackgrounds.map((bg, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setSelectedBackground(bg);
                    setShowBackgroundPicker(false);
                  }}
                  className={cn(
                    "w-8 h-8 rounded-full border-2",
                    selectedBackground === bg ? "border-gray-900" : "border-gray-300"
                  )}
                  style={{ background: bg }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageSelect}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoSelect}
        className="hidden"
      />
    </Card>
  );
}