'use client';

import React, { useRef, useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Image from 'next/image';

interface CoverImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  currentImage?: string;
  title?: string;
}

export function CoverImageUploadModal({
  isOpen,
  onClose,
  onUpload,
  currentImage,
  title = 'Changer la couverture',
}: CoverImageUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image valide');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Le fichier doit faire moins de 5 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setSelectedFile(file);
      setError('');
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    const file = selectedFile || fileInputRef.current?.files?.[0];
    if (!file) {
      setError('Veuillez sélectionner une image');
      return;
    }

    try {
      setIsLoading(true);
      setError('');
      // Call provided upload handler and surface any error
      try {
        await onUpload(file);
      } catch (uploadErr) {
        console.error('Upload handler error:', uploadErr);
        throw uploadErr;
      }
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du téléchargement');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
          <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Preview */}
        <div className="mb-6">
          {preview ? (
            <div className={`relative h-40 w-full rounded-lg overflow-hidden transition-all duration-300 ${isLoading ? 'blur-md opacity-60' : ''}`}>
              <Image
                src={preview}
                alt="Preview"
                fill
                className="object-cover"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-white text-xs font-semibold">Uploading...</p>
                  </div>
                </div>
              )}
            </div>
          ) : currentImage ? (
            <div className={`relative h-40 w-full rounded-lg overflow-hidden transition-all duration-300 ${isLoading ? 'blur-md opacity-60' : ''}`}>
              <Image
                src={currentImage}
                alt="Current cover"
                fill
                className="object-cover"
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p className="text-white text-xs font-semibold">Uploading...</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-40 w-full rounded-lg bg-gray-100 flex items-center justify-center">
              <ImageIcon size={40} className="text-gray-300" />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {/* File Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full mb-4 p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition text-gray-600 hover:text-gray-900 font-medium"
        >
          <Upload size={20} className="mx-auto mb-2" />
          Sélectionner une image
        </button>

        {/* Actions */}
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleClose} disabled={isLoading} className="flex-1">
            Annuler
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!preview || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Téléchargement...' : 'Mettre à jour'}
          </Button>
        </div>
      </div>
    </div>
  );
}
