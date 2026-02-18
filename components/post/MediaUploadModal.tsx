'use client';

import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon, Video } from 'lucide-react';

interface MediaUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImagesUpload: (images: string[]) => void;
  onVideosUpload: (videos: string[]) => void;
  images: string[];
  videos: string[];
}

export default function MediaUploadModal({
  isOpen,
  onClose,
  onImagesUpload,
  onVideosUpload,
  images,
  videos,
}: MediaUploadModalProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImages, setUploadingImages] = useState<Map<number, number>>(new Map());
  const [uploadingVideos, setUploadingVideos] = useState<Map<number, number>>(new Map());
  const [imagePreview, setImagePreview] = useState<string[]>(images);
  const [videoPreview, setVideoPreview] = useState<string[]>(videos);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const xhr = new XMLHttpRequest();
        
        // Track progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadingImages(prev => new Map(prev).set(i, percentComplete));
          }
        });

        // Handle completion
        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.urls && Array.isArray(data.urls) && data.urls.length > 0) {
                setImagePreview(prev => [...prev, ...data.urls]);
              } else {
                console.error('No URLs in upload response:', data);
              }
            } catch (e) {
              console.error('Failed to parse upload response:', xhr.responseText, e);
            }
            setUploadingImages(prev => {
              const newMap = new Map(prev);
              newMap.delete(i);
              return newMap;
            });
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              console.error('Upload failed:', xhr.status, errorData);
            } catch {
              console.error('Upload failed:', xhr.status, xhr.statusText, xhr.responseText);
            }
            setUploadingImages(prev => {
              const newMap = new Map(prev);
              newMap.delete(i);
              return newMap;
            });
          }
        });

        // Handle error
        xhr.addEventListener('error', () => {
          console.error('Upload error:', xhr.statusText);
          setUploadingImages(prev => {
            const newMap = new Map(prev);
            newMap.delete(i);
            return newMap;
          });
        });

        // Send request with credentials
        const formData = new FormData();
        formData.append('files', file);
        formData.append('type', 'image');
        xhr.withCredentials = true; // Send cookies for authentication
        xhr.open('POST', '/api/upload');
        xhr.send(formData);
        setUploadingImages(prev => new Map(prev).set(i, 0));
      }
    }
    if (imageInputRef.current) imageInputRef.current.value = '';
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        const xhr = new XMLHttpRequest();
        
        // Track progress
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadingVideos(prev => new Map(prev).set(i, percentComplete));
          }
        });

        // Handle completion
        xhr.addEventListener('load', async () => {
          if (xhr.status === 200) {
            try {
              const data = JSON.parse(xhr.responseText);
              if (data.urls && Array.isArray(data.urls) && data.urls.length > 0) {
                setVideoPreview(prev => [...prev, ...data.urls]);
              } else {
                console.error('No URLs in upload response:', data);
              }
            } catch (e) {
              console.error('Failed to parse upload response:', xhr.responseText, e);
            }
            setUploadingVideos(prev => {
              const newMap = new Map(prev);
              newMap.delete(i);
              return newMap;
            });
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText);
              console.error('Upload failed:', xhr.status, errorData);
            } catch {
              console.error('Upload failed:', xhr.status, xhr.statusText, xhr.responseText);
            }
            setUploadingVideos(prev => {
              const newMap = new Map(prev);
              newMap.delete(i);
              return newMap;
            });
          }
        });

        // Handle error
        xhr.addEventListener('error', () => {
          console.error('Upload error:', xhr.statusText);
          setUploadingVideos(prev => {
            const newMap = new Map(prev);
            newMap.delete(i);
            return newMap;
          });
        });

        // Send request with credentials
        const formData = new FormData();
        formData.append('files', file);
        formData.append('type', 'video');
        xhr.withCredentials = true; // Send cookies for authentication
        xhr.open('POST', '/api/upload');
        xhr.send(formData);
        setUploadingVideos(prev => new Map(prev).set(i, 0));
      }
    }
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setImagePreview(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideoPreview(prev => prev.filter((_, i) => i !== index));
  };

  const handleApply = () => {
    onImagesUpload(imagePreview);
    onVideosUpload(videoPreview);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">📸 Ajouter des photos et vidéos</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Upload Instructions */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              💡 Vous pouvez ajouter plusieurs photos et vidéos à votre post. Glissez-déposez ou cliquez pour sélectionner des fichiers.
            </p>
          </div>

          {/* Photos Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ImageIcon size={20} className="text-green-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Photos</h4>
              <span className="text-sm text-gray-500">({imagePreview.length})</span>
            </div>

            {/* Upload Button */}
            <button
              onClick={() => imageInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-green-500 dark:hover:border-green-400 transition"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Glissez des photos ici ou cliquez pour sélectionner
              </p>
            </button>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Image Previews */}
            {imagePreview.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {imagePreview.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-square"
                  >
                    <img
                      src={img}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {uploadingImages.has(idx) && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 border-3 border-white border-t-blue-400 rounded-full animate-spin" />
                        <span className="text-white text-sm font-semibold">{uploadingImages.get(idx)}%</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeImage(idx)}
                      disabled={uploadingImages.has(idx)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Videos Section */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-4">
              <Video size={20} className="text-red-600" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Vidéos</h4>
              <span className="text-sm text-gray-500">({videoPreview.length})</span>
            </div>

            {/* Upload Button */}
            <button
              onClick={() => videoInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-red-500 dark:hover:border-red-400 transition"
            >
              <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                Glissez des vidéos ici ou cliquez pour sélectionner
              </p>
            </button>
            <input
              ref={videoInputRef}
              type="file"
              accept="video/*"
              multiple
              onChange={handleVideoUpload}
              className="hidden"
            />

            {/* Video Previews */}
            {videoPreview.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {videoPreview.map((vid, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 aspect-video"
                  >
                    <video
                      src={vid}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/40 transition">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                    {uploadingVideos.has(idx) && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                        <div className="w-12 h-12 border-3 border-white border-t-red-400 rounded-full animate-spin" />
                        <span className="text-white text-sm font-semibold">{uploadingVideos.get(idx)}%</span>
                      </div>
                    )}
                    <button
                      onClick={() => removeVideo(idx)}
                      disabled={uploadingVideos.has(idx)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition disabled:opacity-50"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            onClick={handleApply}
            disabled={imagePreview.length === 0 && videoPreview.length === 0}
            className="px-4 py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition"
          >
            Appliquer ({imagePreview.length + videoPreview.length})
          </button>
        </div>
      </div>
    </div>
  );
}

// Play icon component (missing from lucide-react in some versions)
function Play({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
