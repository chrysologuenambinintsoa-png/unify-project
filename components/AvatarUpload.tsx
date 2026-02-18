'use client';

import React, { useState, useRef } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onAvatarChange?: (newAvatar: string | null) => void;
  size?: 'md' | 'lg' | 'xl';
}

export function AvatarUpload({ currentAvatar, onAvatarChange, size = 'lg' }: AvatarUploadProps) {
  const { data: session, update } = useSession();
  const { translation } = useLanguage();
  const [isUploading, setIsUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: get image dimensions from File
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

  // Helper: resize image to max 1024x1024 if needed, maintaining aspect ratio
  const resizeImageIfNeeded = async (file: File): Promise<File> => {
    try {
      const dims = await getImageDimensions(file);
      const MAX_DIM = 1024;

      // If already within limits, return as-is
      if (dims.width <= MAX_DIM && dims.height <= MAX_DIM) {
        return file;
      }

      // Calculate new dimensions maintaining aspect ratio
      let newWidth = dims.width;
      let newHeight = dims.height;
      const aspectRatio = dims.width / dims.height;

      if (dims.width > MAX_DIM || dims.height > MAX_DIM) {
        if (dims.width > dims.height) {
          newWidth = MAX_DIM;
          newHeight = Math.round(MAX_DIM / aspectRatio);
        } else {
          newHeight = MAX_DIM;
          newWidth = Math.round(MAX_DIM * aspectRatio);
        }
      }

      // Use canvas to resize
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = newWidth;
            canvas.height = newHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, newWidth, newHeight);
            }
            canvas.toBlob((blob) => {
              if (blob) {
                const resized = new File([blob], file.name, { type: 'image/jpeg' });
                resolve(resized);
              } else {
                resolve(file); // fallback
              }
            }, 'image/jpeg', 0.95);
          };
          img.src = String(reader.result);
        };
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.error('Error resizing image:', err);
      return file; // return original on error
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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert(`${translation.validation.fileSizeTooLarge} 5MB.`);
      return;
    }

    // Upload directly, auto-resizing if needed
    (async () => {
      try {
        const resized = await resizeImageIfNeeded(file);
        uploadAvatar(resized);
      } catch (err) {
        console.error('Error processing avatar:', err);
        uploadAvatar(file);
      }
    })();
  };

  const uploadAvatar = async (file: File) => {
    try {
      setIsUploading(true);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onAvatarChange?.(data.avatar);

        // Update session
        await update();
      } else {
        const error = await response.json();
        alert(error.error || translation.errors.uploadError);
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert(translation.errors.uploadError);
    } finally {
      setIsUploading(false);
      setShowOptions(false);
    }
  };

  const removeAvatar = async () => {
    if (!confirm(translation.profile.deleteCoverConfirm)) return;

    try {
      setIsUploading(true);

      const response = await fetch('/api/avatar', {
        method: 'DELETE',
      });

      if (response.ok) {
        onAvatarChange?.(null);

        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            avatar: null,
          },
        });
      } else {
        alert(translation.errors.deleteError);
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      alert(translation.errors.deleteError);
    } finally {
      setIsUploading(false);
    }
  };

  const generateRandomAvatar = () => {
    const seed = session?.user?.username || session?.user?.id || 'default';
    const randomAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}_${Date.now()}`;
    onAvatarChange?.(randomAvatar);
  };

  return (
    <div className="relative">
      <div
        className="relative group cursor-pointer"
        onMouseEnter={() => setShowOptions(true)}
        onMouseLeave={() => setShowOptions(false)}
      >
        <div className={`transition-all duration-300 ${isUploading ? 'blur-sm opacity-60' : ''}`}>
          <Avatar
            src={currentAvatar}
            name={session?.user?.fullName || session?.user?.username}
            userId={session?.user?.id}
            size={size}
            className="ring-4 ring-white shadow-lg"
          />
        </div>

        {/* Upload progress overlay */}
        {isUploading && (
          <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-xs font-semibold">Uploading...</p>
            </div>
          </div>
        )}

        {/* Upload overlay */}
        {showOptions && !isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <div className="flex space-x-1">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                title={translation.profile.changeCover}
              >
                <Camera className="w-4 h-4" />
              </button>
              {currentAvatar && (
                <button
                  onClick={removeAvatar}
                  className="p-2 bg-white rounded-full text-red-600 hover:bg-red-100"
                  title={translation.common.delete}
                >
                  <X className="w-4 h-4" />
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
          {translation.settings.uploadPhoto}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={generateRandomAvatar}
          disabled={isUploading}
        >
          {translation.settings.randomAvatar}
        </Button>
      </div>
    </div>
  );
}
