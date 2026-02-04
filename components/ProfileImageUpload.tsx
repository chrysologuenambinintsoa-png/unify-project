'use client';

import React, { useRef, useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProfileImageUploadProps {
  pageId?: string;
  groupId?: string;
  onImageUploaded?: (url: string) => void;
  currentImage?: string;
}

export function ProfileImageUpload({
  pageId,
  groupId,
  onImageUploaded,
  currentImage,
}: ProfileImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    try {
      setLoading(true);
      setError('');

      const formData = new FormData();
      formData.append('file', file);

      const endpoint = pageId
        ? `/api/pages/${pageId}/upload-profile`
        : `/api/groups/${groupId}/upload-profile`;

      const res = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to upload image');
      }

      const result = await res.json();
      setPreview(result.url);
      onImageUploaded?.(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      setPreview(currentImage || null);
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <ImageIcon className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold">Profile Image</h3>
      </div>

      {error && (
        <div className="bg-red-500/20 text-red-300 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="relative">
        {preview ? (
          <div className="relative inline-block">
            <img
              src={preview}
              alt="Profile preview"
              className="w-32 h-32 rounded-lg object-cover border-2 border-amber-500/50"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="absolute bottom-0 right-0 bg-amber-600 hover:bg-amber-700 text-white p-2 rounded-full shadow-lg disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            className="w-32 h-32 border-2 border-dashed border-amber-500/40 rounded-lg hover:border-amber-500 transition flex items-center justify-center disabled:opacity-50"
          >
            <div className="text-center">
              <Upload className="w-6 h-6 text-amber-500 mx-auto mb-2" />
              <span className="text-xs text-gray-400">Click to upload</span>
            </div>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        disabled={loading}
        className="hidden"
      />

      <Button
        onClick={() => fileInputRef.current?.click()}
        variant="secondary"
        disabled={loading}
        className="w-full"
      >
        <Upload className="w-4 h-4 mr-2" />
        {loading ? 'Uploading...' : 'Choose Image'}
      </Button>

      <p className="text-xs text-gray-400">
        Max 5MB. Supported: JPG, PNG, WebP, GIF
      </p>
    </div>
  );
}
