'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { X } from 'lucide-react';
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

  const containerWidth = 400;
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
            className="bg-white rounded-lg shadow-2xl max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Preview container */}
              <div
                className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-100 cursor-move"
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
              </div>

              {/* Scale slider */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Zoom: {Math.round(scale * 100)}%
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={scale}
                  onChange={handleScaleChange}
                  className="w-full"
                />
              </div>

              {/* Hidden canvas for processing */}
              <canvas
                ref={canvasRef}
                width={containerWidth}
                height={containerHeight}
                className="hidden"
              />
            </div>

            {/* Footer */}
            <div className="flex gap-2 p-4 border-t bg-gray-50">
              <Button
                variant="secondary"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-primary-dark to-accent-dark text-white"
              >
                Save & Upload
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
