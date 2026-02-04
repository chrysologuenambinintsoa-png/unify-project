'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageCropModalProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onSave: (croppedImage: string, file: File) => void;
  aspectRatio?: number; // width/height ratio
  title?: string;
  minWidth?: number;
  minHeight?: number;
}

export function ImageCropModal({
  isOpen,
  imageSrc,
  onClose,
  onSave,
  aspectRatio = 1,
  title = 'Adjust Image',
  minWidth = 100,
  minHeight = 100,
}: ImageCropModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isMounted, setIsMounted] = useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const containerWidth = isMounted ? Math.min(320, typeof window !== 'undefined' ? window.innerWidth - 40 : 320) : 320;
  const containerHeight = Math.round(containerWidth / aspectRatio);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offsetX, y: e.clientY - offsetY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffsetX(e.clientX - dragStart.x);
    setOffsetY(e.clientY - dragStart.y);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(parseFloat(e.target.value));
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleSave = async () => {
    if (!canvasRef.current || !imgRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, containerWidth, containerHeight);

    // Draw image with transformations
    ctx.save();
    ctx.translate(containerWidth / 2, containerHeight / 2);
    ctx.scale(scale, scale);
    ctx.translate(offsetX / scale - containerWidth / (2 * scale), offsetY / scale - containerHeight / (2 * scale));
    ctx.drawImage(imgRef.current, 0, 0);
    ctx.restore();

    // Convert canvas to file
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' });
        const dataUrl = canvasRef.current!.toDataURL('image/jpeg', 0.95);
        onSave(dataUrl, file);
        onClose();
      }
    }, 'image/jpeg', 0.95);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - Facebook style */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="font-bold text-xl text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - scrollable */}
            <div className="overflow-y-auto p-4 space-y-3 flex-1">
              {/* Preview container with border guide - Facebook style */}
              <div className="flex justify-center">
                <div
                  className="relative border-4 border-primary rounded-lg overflow-hidden bg-gray-100 cursor-move shadow-lg"
                  style={{
                    width: `${containerWidth}px`,
                    height: `${containerHeight}px`,
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="crop"
                    className="absolute select-none pointer-events-none"
                    style={{
                      transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
                      transformOrigin: 'top left',
                    }}
                    onDragStart={(e) => e.preventDefault()}
                  />
                  
                  {/* Grid guide overlay */}
                  <div className="absolute inset-0 pointer-events-none opacity-30">
                    <div className="absolute w-full h-1/3 border-t border-gray-400" style={{ top: '33.33%' }} />
                    <div className="absolute w-full h-1/3 border-t border-gray-400" style={{ top: '66.66%' }} />
                    <div className="absolute h-full w-1/3 border-l border-gray-400" style={{ left: '33.33%' }} />
                    <div className="absolute h-full w-1/3 border-l border-gray-400" style={{ left: '66.66%' }} />
                  </div>
                </div>
              </div>

              {/* Zoom Controls - Facebook style */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleZoomOut}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    title="Zoom out"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-700" />
                  </button>
                  
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.05"
                    value={scale}
                    onChange={handleScaleChange}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                  
                  <button
                    onClick={handleZoomIn}
                    className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                    title="Zoom in"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
                
                <div className="text-center text-xs text-gray-600 font-medium">
                  Zoom: {Math.round(scale * 100)}%
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                <p className="text-xs text-gray-700">
                  💡 Déplacez l'image pour composer votre crop • Utilisez le zoom pour ajuster la taille
                </p>
              </div>

              {/* Hidden canvas for processing */}
              <canvas
                ref={canvasRef}
                width={containerWidth}
                height={containerHeight}
                className="hidden"
              />
            </div>

            {/* Footer - Facebook style */}
            <div className="flex gap-2 p-4 border-t bg-gray-50 rounded-b-2xl flex-shrink-0">
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1 text-sm"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-primary to-accent text-white hover:shadow-lg transition-shadow text-sm"
              >
                Enregistrer
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
