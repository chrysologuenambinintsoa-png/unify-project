'use client';

import React, { useState, useRef } from 'react';
import { Camera, X, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

    try {
      // Process image client-side: automatic center-crop & resize to 1200x300 (4:1)
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });

      const processed = await (async () => {
        return new Promise<{ dataUrl: string; file: File }>((resolve, reject) => {
          const img = new Image();
          img.onload = async () => {
            const canvasW = 1200;
            const canvasH = 300;
            const canvas = document.createElement('canvas');
            canvas.width = canvasW;
            canvas.height = canvasH;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas not supported'));

            // scale to cover
            const scale = Math.max(canvasW / img.width, canvasH / img.height);
            const dWidth = img.width * scale;
            const dHeight = img.height * scale;
            const dx = (canvasW - dWidth) / 2;
            const dy = (canvasH - dHeight) / 2;

            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvasW, canvasH);
            ctx.drawImage(img, dx, dy, dWidth, dHeight);

            canvas.toBlob((blob) => {
              if (!blob) return reject(new Error('Failed to create blob'));
              const outFile = new File([blob], 'cover.jpg', { type: 'image/jpeg' });
              const outDataUrl = canvas.toDataURL('image/jpeg', 0.9);
              resolve({ dataUrl: outDataUrl, file: outFile });
            }, 'image/jpeg', 0.9);
          };
          img.onerror = (e) => reject(e);
          img.src = dataUrl;
        });
      })();

      // Show preview and upload automatically
      setPreview(processed.dataUrl);
      setShowOptions(false);
      await uploadCover(processed.file);
    } catch (err) {
      console.error('Error processing cover image:', err);
      alert(translation.errors.uploadError);
    }
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
        setPreview(null);

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
      {/* Cover images are auto-processed client-side; no crop modal required */}

      <div
        className="relative group cursor-pointer w-full h-48 rounded-lg overflow-hidden bg-gradient-to-r from-primary-dark to-accent-dark"
        style={{
          backgroundImage: (preview || currentCover) ? `url(${preview || currentCover})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        onMouseEnter={() => setShowOptions(true)}
        onMouseLeave={() => setShowOptions(false)}
      >
        {/* Upload overlay */}
        <AnimatePresence>
          {showOptions && !isUploading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            >
              <div className="flex space-x-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 bg-white rounded-full text-gray-700 hover:bg-gray-100 transition-colors"
                  title={translation.profile.changeCover}
                >
                  <Camera className="w-5 h-5" />
                </button>
                {currentCover && (
                  <button
                    onClick={removeCover}
                    className="p-3 bg-white rounded-full text-red-600 hover:bg-red-100 transition-colors"
                    title={translation.common.delete}
                  >
                    <X className="w-5 h-5" />
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
              className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
            >
              <Loader2 className="w-8 h-8 text-white animate-spin" />
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
