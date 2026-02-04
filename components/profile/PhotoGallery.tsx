'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Image as ImageIcon, X, Camera, LogIn } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface Photo {
  id: string;
  url: string;
  type: 'profile' | 'cover' | 'gallery';
  caption?: string;
  createdAt: string;
}

interface PhotoGalleryProps {
  userId: string;
  photos: Photo[];
  isOwnProfile: boolean;
  profilePhoto?: string;
  coverPhoto?: string;
  onPhotoUpload?: (photo: Photo) => void;
  onPhotoDelete?: (photoId: string) => void;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  userId,
  photos,
  isOwnProfile,
  profilePhoto,
  coverPhoto,
  onPhotoUpload,
  onPhotoDelete,
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [settingAsProfile, setSettingAsProfile] = useState(false);
  const [settingAsCover, setSettingAsCover] = useState(false);

  const handleDelete = async (photoId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette photo?')) {
      try {
        const response = await fetch(`/api/users/${userId}/photos/${photoId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          onPhotoDelete?.(photoId);
          setSelectedPhoto(null);
        }
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const handleSetAsProfile = async (photo: Photo) => {
    if (!isOwnProfile) return;
    try {
      setSettingAsProfile(true);
      const response = await fetch('/api/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id }),
      });

      if (response.ok) {
        alert('Photo de profil mise à jour');
        setSelectedPhoto(null);
      }
    } catch (error) {
      console.error('Error setting profile photo:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setSettingAsProfile(false);
    }
  };

  const handleSetAsCover = async (photo: Photo) => {
    if (!isOwnProfile) return;
    try {
      setSettingAsCover(true);
      const response = await fetch('/api/cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId: photo.id }),
      });

      if (response.ok) {
        alert('Photo de couverture mise à jour');
        setSelectedPhoto(null);
      }
    } catch (error) {
      console.error('Error setting cover photo:', error);
      alert('Erreur lors de la mise à jour');
    } finally {
      setSettingAsCover(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* All Photos Gallery */}
      {photos.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
            Galerie photos
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((photo, index) => (
              <motion.div
                key={photo.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Photo'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Photo Viewer Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-2xl w-full bg-white rounded-lg overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-gray-200 hover:bg-gray-300 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-700" />
              </button>

              {/* Image */}
              <div className="relative w-full bg-gray-200 flex items-center justify-center max-h-[70vh]">
                <img
                  src={selectedPhoto.url}
                  alt={selectedPhoto.caption || 'Photo'}
                  className="w-full h-auto object-contain"
                />
              </div>

              {/* Caption & Actions */}
              <div className="p-4 space-y-4">
                {selectedPhoto.caption && (
                  <p className="text-gray-700">{selectedPhoto.caption}</p>
                )}

                {isOwnProfile && (
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={() => handleSetAsProfile(selectedPhoto)}
                      disabled={settingAsProfile}
                      className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
                    >
                      <Camera className="w-4 h-4" />
                      Utiliser comme photo de profil
                    </Button>
                    <Button
                      onClick={() => handleSetAsCover(selectedPhoto)}
                      disabled={settingAsCover}
                      className="flex items-center gap-2 bg-green-500 hover:bg-green-600"
                    >
                      <LogIn className="w-4 h-4" />
                      Utiliser comme photo de couverture
                    </Button>
                    <Button
                      onClick={() => handleDelete(selectedPhoto.id)}
                      variant="outline"
                      className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {photos.length === 0 && (
        <Card className="p-12 text-center">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            {isOwnProfile ? 'Aucune photo pour le moment' : 'Cet utilisateur n\'a pas encore de photos'}
          </p>
        </Card>
      )}
    </div>
  );
};
