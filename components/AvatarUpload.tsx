'use client';

import React, { useState, useRef } from 'react';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';

interface AvatarUploadProps {
  currentAvatar?: string | null;
  onAvatarChange?: (newAvatar: string | null) => void;
  size?: 'md' | 'lg' | 'xl';
}

export function AvatarUpload({ currentAvatar, onAvatarChange, size = 'lg' }: AvatarUploadProps) {
  const { data: session, update } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner un fichier image.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('La taille du fichier ne doit pas dépasser 5MB.');
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        setShowOptions(false);
      };
      reader.readAsDataURL(file);

      // Upload file
      uploadAvatar(file);
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

        // Update session
        await update({
          ...session,
          user: {
            ...session?.user,
            avatar: data.avatar,
          },
        });

        setPreview(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Erreur lors du téléchargement');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      alert('Erreur lors du téléchargement de l\'avatar');
    } finally {
      setIsUploading(false);
    }
  };

  const removeAvatar = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer votre avatar ?')) return;

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
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error removing avatar:', error);
      alert('Erreur lors de la suppression de l\'avatar');
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
                  title="Changer d'avatar"
                >
                  <Camera className="w-4 h-4" />
                </button>
                {currentAvatar && (
                  <button
                    onClick={removeAvatar}
                    className="p-2 bg-white rounded-full text-red-600 hover:bg-red-100 transition-colors"
                    title="Supprimer l'avatar"
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
          Télécharger
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={generateRandomAvatar}
          disabled={isUploading}
        >
          Avatar aléatoire
        </Button>
      </div>
    </div>
  );
}