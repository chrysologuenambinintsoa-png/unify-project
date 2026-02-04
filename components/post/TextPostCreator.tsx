'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface TextPostCreatorProps {
  onCreatePost?: (post: any) => void;
}

const BACKGROUNDS = [
  { id: 'gradient-1', name: 'Sunset', class: 'bg-gradient-to-br from-orange-400 via-red-500 to-purple-700' },
  { id: 'gradient-2', name: 'Ocean', class: 'bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-700' },
  { id: 'gradient-3', name: 'Forest', class: 'bg-gradient-to-br from-green-400 via-emerald-500 to-cyan-700' },
  { id: 'gradient-4', name: 'Aurora', class: 'bg-gradient-to-br from-purple-400 via-pink-500 to-red-500' },
  { id: 'gradient-5', name: 'Gold', class: 'bg-gradient-to-br from-yellow-300 via-orange-400 to-red-600' },
  { id: 'gradient-6', name: 'Lavender', class: 'bg-gradient-to-br from-purple-300 via-purple-500 to-indigo-700' },
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
  const [showTextCreator, setShowTextCreator] = useState(false);

  const getAnimationVariants = () => {
    switch (selectedAnimation) {
      case 'bounce':
        return {
          initial: { y: 0 },
          animate: { y: [0, -20, 0] },
          transition: { duration: 0.8, repeat: Infinity },
        };
      case 'pulse':
        return {
          initial: { scale: 1, opacity: 1 },
          animate: { scale: [1, 1.05, 1], opacity: [1, 0.9, 1] },
          transition: { duration: 2, repeat: Infinity },
        };
      case 'rotate':
        return {
          initial: { rotate: 0 },
          animate: { rotate: 360 },
          transition: { duration: 4, repeat: Infinity, ease: 'linear' },
        };
      case 'wave':
        return {
          initial: { skewY: 0 },
          animate: { skewY: [0, 2, -2, 0] },
          transition: { duration: 2, repeat: Infinity },
        };
      case 'shake':
        return {
          initial: { x: 0 },
          animate: { x: [-5, 5, -5, 5, 0] },
          transition: { duration: 0.5, repeat: Infinity },
        };
      case 'glow':
        return {
          initial: { textShadow: '0 0 10px rgba(255,255,255,0.5)' },
          animate: { textShadow: ['0 0 10px rgba(255,255,255,0.5)', '0 0 20px rgba(255,255,255,0.8)', '0 0 10px rgba(255,255,255,0.5)'] },
          transition: { duration: 1.5, repeat: Infinity },
        };
      case 'scale':
        return {
          initial: { scale: 1 },
          animate: { scale: [1, 1.1, 1] },
          transition: { duration: 1.5, repeat: Infinity },
        };
      default:
        return {};
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
      setShowTextCreator(false);
    } catch (error) {
      console.error('Error creating text post:', error);
      alert('Failed to create text post');
    } finally {
      setIsCreating(false);
    }
  };

  if (!showTextCreator) {
    return (
      <button
        onClick={() => setShowTextCreator(true)}
        className="w-full bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 mb-4 text-left hover:shadow-lg transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary-dark rounded-full flex items-center justify-center text-white flex-shrink-0">
            {session?.user?.image ? (
              <Image
                src={session.user.image}
                alt={session?.user?.name || 'User'}
                width={40}
                height={40}
                className="w-full h-full object-cover rounded-full"
              />
            ) : (
              <span className="font-bold">{session?.user?.name?.[0]?.toUpperCase() || 'U'}</span>
            )}
          </div>
          <span className="text-gray-500 dark:text-gray-400">Créer une publication texte...</span>
        </div>
      </button>
    );
  }

  const bgClass = BACKGROUNDS.find(bg => bg.id === selectedBackground)?.class || BACKGROUNDS[0].class;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md p-4 mb-4 w-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Créer une publication texte</h3>

        {/* Text Input */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrivez votre message..."
          rows={4}
          className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-dark resize-none mb-4"
        />

        {/* Preview Section */}
        {text.trim() && (
          <div className="mb-4 p-6 rounded-lg min-h-[200px] flex items-center justify-center">
            <div className={`${bgClass} p-8 rounded-lg w-full min-h-[200px] flex items-center justify-center transform transition-all duration-300`}>
              <motion.div
                {...getAnimationVariants()}
                className="text-center"
              >
                <p className="text-white text-2xl md:text-4xl font-bold leading-tight break-words">
                  {text}
                </p>
              </motion.div>
            </div>
          </div>
        )}

        {/* Background Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Fond
          </label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {BACKGROUNDS.map((bg) => (
              <button
                key={bg.id}
                onClick={() => setSelectedBackground(bg.id)}
                className={`p-3 rounded-lg transition border-2 ${
                  selectedBackground === bg.id
                    ? 'border-primary-dark scale-105'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
                title={bg.name}
              >
                <div className={`w-full h-12 rounded ${bg.class}`} />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 text-center truncate">
                  {bg.name}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Animation Selection */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
            Animation
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ANIMATIONS.map((anim) => (
              <button
                key={anim.id}
                onClick={() => setSelectedAnimation(anim.id)}
                className={`p-3 rounded-lg transition border-2 ${
                  selectedAnimation === anim.id
                    ? 'border-primary-dark bg-primary-dark/10'
                    : 'border-gray-300 dark:border-gray-600 hover:border-primary-dark'
                }`}
              >
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {anim.name}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowTextCreator(false)}
          className="flex-1 px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition"
        >
          Annuler
        </button>
        <button
          onClick={handleCreatePost}
          disabled={!text.trim() || isCreating}
          className="flex-1 px-4 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark disabled:bg-gray-400 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition"
        >
          {isCreating ? 'Création...' : 'Publier'}
        </button>
      </div>
    </div>
  );
}
