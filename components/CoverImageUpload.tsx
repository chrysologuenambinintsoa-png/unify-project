'use client';

import React, { useState, useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CoverImageUploadProps {
  currentCover?: string | null;
  onCoverChange?: (newCover: string | null) => void;
}

export function CoverImageUpload({ currentCover, onCoverChange }: CoverImageUploadProps) {
  const { data: session, update } = useSession();
  const { translation } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert(translation.validation.selectImage);
      return;
    }

    // Validate file size (max 10MB for cover)
    if (file.size > 10 * 1024 * 1024) {
      alert(`${translation.validation.fileSizeTooLarge} 10MB.`);
      return;
    }

    // Auto-resize if needed and upload
    (async () => {
      try {
        const resized = await resizeImageIfNeeded(file);
        uploadCover(resized);
      } catch (err) {
        console.error('Error processing cover:', err);
        uploadCover(file);
      }
    })();
  };

  const uploadCover = async (file: File) => {
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('cover', file);

      const response = await fetch('/api/cover', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onCoverChange?.(data.coverImage);

        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            coverImage: data.coverImage,
          },
        });
      } else {
        const error = await response.json();
        alert(error.error || translation.errors.uploadError);
      }
    } catch (error) {
      console.error('Error uploading cover:', error);
      alert(translation.errors.uploadError);
    } finally {
      setIsUploading(false);
    }
  };

  const removeCover = async () => {
    if (!confirm(translation.profile.deleteCoverConfirm)) return;

    try {
      setIsUploading(true);

      const response = await fetch('/api/cover', {
        method: 'DELETE',
      });

      if (response.ok) {
        onCoverChange?.(null);

        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            coverImage: null,
          },
        });
      } else {
        alert(translation.errors.deleteError);
      }
    } catch (error) {
      console.error('Error removing cover:', error);
      alert(translation.errors.deleteError);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <div
        className="relative group cursor-pointer w-full h-48 rounded-lg overflow-hidden bg-gradient-to-r from-primary-dark to-accent-dark"
        style={{
          backgroundImage: currentCover ? `url(${currentCover})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onMouseEnter={() => setShowOptions(true)}
        onMouseLeave={() => setShowOptions(false)}
      >
        {/* Upload overlay */}
        {showOptions && !isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-3 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                title={translation.profile.changeCover}
              >
                <Camera className="w-5 h-5" />
              </button>
              {currentCover && (
                <button
                  onClick={removeCover}
                  className="p-3 bg-white rounded-full text-red-600 hover:bg-red-100"
                  title={translation.common.delete}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}


        {/* Loading overlay removed */}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Quick actions */}
      <div className="mt-4 flex justify-center space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {translation.profile.uploadCover}
        </Button>
        {currentCover && (
          <Button
            variant="secondary"
            size="sm"
            onClick={removeCover}
            disabled={isUploading}
            className="text-red-600"
          >
            <X className="w-4 h-4 mr-2" />
            {translation.profile.removeCover}
          </Button>
        )}
      </div>
    </div>
  );
}
