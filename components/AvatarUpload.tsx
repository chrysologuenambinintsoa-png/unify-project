'use client';

import React, { useState, useRef } from 'react';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { ImageCropModal } from '@/components/ImageCropModal';

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
  const [preview, setPreview] = useState<string | null>(null);
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
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

      // Create preview for crop modal
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setImageToEdit(dataUrl);
        setCropModalOpen(true);
        setShowOptions(false);
      };
      reader.readAsDataURL(file);
    }
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
        setPreview(null);

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
    }
  };

  const handleCropSave = async (croppedImage: string, file: File) => {
    // Update preview with cropped image
    setPreview(croppedImage);
    // Upload the cropped file
    await uploadAvatar(file);
    setCropModalOpen(false);
    setImageToEdit(null);
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
      <ImageCropModal
        isOpen={cropModalOpen}
        imageSrc={imageToEdit || ''}
        onClose={() => {
          setCropModalOpen(false);
          setImageToEdit(null);
        }}
        onSave={handleCropSave}
        aspectRatio={1}
        title={translation.settings.profilePhoto}
        minWidth={200}
        minHeight={200}
      />

      <div
        className="relative group cursor-pointer"
        onMouseEnter={() => setShowOptions(true)}
        onMouseLeave={() => setShowOptions(false)}
      >
        <Avatar
          src={preview || currentAvatar}
          name={session?.user?.fullName || session?.user?.username}
          size={size}
          className="ring-4 ring-white shadow-lg"
        />

        {/* Upload overlay */}
        <AnimatePresence>
          {showOptions && !isUploading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center"
            >
              <div className="flex space-x-1">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                  title={translation.profile.changeCover}
                >
                  <Camera className="w-4 h-4" />
                </button>
                {currentAvatar && (
                  <button
                    onClick={removeAvatar}
                    className="p-2 bg-white rounded-full text-red-600 hover:bg-red-100 transition-colors"
                    title={translation.common.delete}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay */}
        <AnimatePresence>
          {isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center"
            >
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </motion.div>
          )}
        </AnimatePresence>
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