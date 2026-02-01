'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Image as ImageIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

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
  // Separate photos by type
  const profilePhotos = photos.filter(p => p.type === 'profile');
  const coverPhotos = photos.filter(p => p.type === 'cover');
  const galleryPhotos = photos.filter(p => p.type === 'gallery');

  const handleDelete = async (photoId: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette photo?')) {
      try {
        const response = await fetch(`/api/users/${userId}/photos/${photoId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          onPhotoDelete?.(photoId);
        }
      } catch (error) {
        console.error('Delete error:', error);
      }
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
                className="relative aspect-square rounded-lg overflow-hidden group"
              >
                <img
                  src={photo.url}
                  alt={photo.caption || 'Photo'}
                  className="w-full h-full object-cover"
                />
                {isOwnProfile && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2"
                  >
                    <button
                      onClick={() => handleDelete(photo.id)}
                      className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        </Card>
      )}

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
