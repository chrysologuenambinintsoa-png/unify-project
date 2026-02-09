'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface TextPostCreatorProps {
  onCreatePost?: (post: any) => void;
}

const BACKGROUNDS = [
  { id: 'gradient-1', name: 'Sunset', style: 'linear-gradient(to bottom right, rgb(251, 146, 60), rgb(239, 68, 68), rgb(126, 34, 206))' },
  { id: 'gradient-2', name: 'Ocean', style: 'linear-gradient(to bottom right, rgb(96, 165, 250), rgb(34, 211, 238), rgb(20, 184, 166))' },
  { id: 'gradient-3', name: 'Forest', style: 'linear-gradient(to bottom right, rgb(74, 222, 128), rgb(16, 185, 129), rgb(34, 211, 238))' },
  { id: 'gradient-4', name: 'Aurora', style: 'linear-gradient(to bottom right, rgb(192, 132, 250), rgb(236, 72, 153), rgb(239, 68, 68))' },
  { id: 'gradient-5', name: 'Gold', style: 'linear-gradient(to bottom right, rgb(253, 224, 71), rgb(251, 146, 60), rgb(220, 38, 38))' },
  { id: 'gradient-6', name: 'Lavender', style: 'linear-gradient(to bottom right, rgb(196, 181, 253), rgb(168, 85, 247), rgb(99, 102, 241))' },
];

const ANIMATIONS = [
  { id: 'none', name: 'Aucune animation', animation: 'none' },
  { id: 'bounce', name: 'Rebond', animation: 'bounce' },
  { id: 'pulse', name: 'Pulsation', animation: 'pulse' },
  { id: 'rotate', name: 'Rotation', animation: 'rotate' },
  { id: 'wave', name: 'Vague', animation: 'wave' },
  { id: 'shake', name: 'Secousse', animation: 'shake' },
  { id: 'glow', name: 'Luminescence', animation: 'glow' },
  { id: 'scale', name: 'Mise à l\'échelle', animation: 'scale' },
];

export default function TextPostCreator({ onCreatePost }: TextPostCreatorProps) {
  const { data: session } = useSession();
  const [text, setText] = useState('');
  const [selectedBackground, setSelectedBackground] = useState('gradient-1');
  const [selectedAnimation, setSelectedAnimation] = useState('none');
  const [isCreating, setIsCreating] = useState(false);

  const getAnimationVariants = (): { initial: any; animate: any; transition?: any } => {
    const baseVariants = {
      initial: { opacity: 0, scale: 0.9 },
      animate: { opacity: 1, scale: 1 },
    };
    
    if (selectedAnimation === 'none') {
      return baseVariants;
    }
    
    switch (selectedAnimation) {
      case 'bounce':
        return {
          initial: { y: 0, opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1, y: [0, -20, 0] },
          transition: { duration: 0.8, repeat: Infinity, delay: 0.2 },
        };
      case 'pulse':
        return {
          initial: { scale: 0.9, opacity: 0 },
          animate: { opacity: 1, scale: [0.9, 1.05, 0.9] },
          transition: { duration: 2, repeat: Infinity, delay: 0.2 },
        };
      case 'rotate':
        return {
          initial: { rotate: 0, opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1, rotate: 360 },
          transition: { duration: 4, repeat: Infinity, ease: 'linear', delay: 0.2 },
        };
      case 'wave':
        return {
          initial: { skewY: 0, opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1, skewY: [0, 2, -2, 0] },
          transition: { duration: 2, repeat: Infinity, delay: 0.2 },
        };
      case 'shake':
        return {
          initial: { x: 0, opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1, x: [-5, 5, -5, 5, 0] },
          transition: { duration: 0.5, repeat: Infinity, delay: 0.2 },
        };
      case 'glow':
        return {
          initial: { opacity: 0, scale: 0.9 },
          animate: { opacity: 1, scale: 1 },
          transition: { delay: 0.2 },
        };
      case 'scale':
        return {
          initial: { scale: 0.8, opacity: 0 },
          animate: { opacity: 1, scale: [0.8, 1.1, 0.8] },
          transition: { duration: 1.5, repeat: Infinity, delay: 0.2 },
        };
      default:
        return baseVariants;
    }
  };

  const handleCreatePost = async () => {
    if (!text.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: text,
          isTextPost: true,
          styling: {
            background: selectedBackground,
            animation: selectedAnimation,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create text post');
      }

      const newPost = await response.json();
      onCreatePost?.(newPost);
      
      // Reset form
      setText('');
      setSelectedBackground('gradient-1');
      setSelectedAnimation('none');
    } catch (error) {
      console.error('Error creating text post:', error);
      alert('Failed to create text post');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-white mb-4">Créer une publication texte</h3>

        {/* Text Input */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrivez votre message..."
          rows={3}
          className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg px-3 md:px-4 py-2 md:py-3 text-sm md:text-base text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-dark resize-none mb-4"
        />

        {/* Preview Section */}
        {text.trim() && (
          <div className="mb-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 p-3 md:p-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
            <motion.div
              key={selectedAnimation}
              initial={getAnimationVariants().initial}
              animate={getAnimationVariants().animate}
              transition={getAnimationVariants().transition}
              className="p-4 md:p-8 rounded-lg w-full min-h-[150px] md:min-h-[200px] flex items-center justify-center transform transition-all duration-300 shadow-lg"
              style={{ background: BACKGROUNDS.find(bg => bg.id === selectedBackground)?.style || BACKGROUNDS[0].style }}
            >
              <p className="text-lg md:text-3xl lg:text-4xl font-bold leading-tight break-words text-white drop-shadow-lg text-center px-4">
                {text}
              </p>
            </motion.div>
          </div>
        )}

        {/* Background Selection */}
        <div className="mb-4">
          <label className="block text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Fond
          </label>
          <div className="grid grid-cols-3 gap-2">
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setSelectedBackground(bg.id)}
                className={`p-2 rounded-lg transition border-2 ${
                  selectedBackground === bg.id
                    ? 'border-primary-dark scale-105'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                title={bg.name}
              >
                <div 
                  className="w-full h-8 md:h-12 rounded"
                  style={{ background: bg.style }}
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center truncate">
                  {bg.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Animation Selection */}
        <div className="mb-4">
          <label className="block text-xs md:text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Animation
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {ANIMATIONS.map((anim) => (
              <button
                key={anim.id}
                onClick={() => setSelectedAnimation(anim.id)}
                className={`p-2 md:p-3 rounded-lg transition border-2 ${
                  selectedAnimation === anim.id
                    ? 'border-primary-dark bg-primary-dark/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-dark'
                }`}
              >
                <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white truncate">
                  {anim.name}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 md:gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            setText('');
            setSelectedBackground('gradient-1');
            setSelectedAnimation('none');
          }}
          className="flex-1 px-3 md:px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition text-sm md:text-base"
        >
          Annuler
        </button>
        <button
          onClick={handleCreatePost}
          disabled={!text.trim() || isCreating}
          className="flex-1 px-3 md:px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition text-sm md:text-base"
        >
          {isCreating ? 'Création...' : 'Publier'}
        </button>
      </div>
    </div>
  );
}
