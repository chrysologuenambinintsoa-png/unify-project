'use client';

import { useState, useRef, useEffect } from 'react';

interface ReactionPickerProps {
  onReact: (reaction: string) => void;
  onClose: () => void;
  position?: { x: number; y: number };
}

const reactions = [
  { emoji: '👍', label: 'Like', color: 'from-blue-400 to-blue-600' },
  { emoji: '❤️', label: 'Love', color: 'from-red-400 to-red-600' },
  { emoji: '😂', label: 'Haha', color: 'from-yellow-400 to-yellow-600' },
  { emoji: '😮', label: 'Wow', color: 'from-orange-400 to-orange-600' },
  { emoji: '😢', label: 'Sad', color: 'from-blue-300 to-blue-500' },
  { emoji: '😡', label: 'Angry', color: 'from-red-500 to-red-700' },
  { emoji: '🔥', label: 'Fire', color: 'from-orange-500 to-red-600' },
  { emoji: '🎉', label: 'Celebrate', color: 'from-purple-400 to-pink-600' },
];

export default function ReactionPicker({ onReact, onClose, position }: ReactionPickerProps) {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={pickerRef}
      className={`absolute bg-white rounded-full shadow-2xl p-3 flex space-x-2 z-50 backdrop-blur-sm border-2 border-amber-200 ${position ? '' : 'bottom-full left-0 mb-3'}`}
      style={position ? { left: Math.max(position.x - 150, 10), top: position.y } : undefined}
    >
      {reactions.map((reaction, index) => (
        <button
          key={reaction.label}
          onClick={() => {
            onReact(reaction.label);
            onClose();
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
          className="relative group flex-shrink-0"
        >
          <div 
            className={`w-12 h-12 rounded-full bg-gradient-to-br ${reaction.color} flex items-center justify-center text-3xl transform transition-all duration-200 hover:scale-150 hover:shadow-2xl active:scale-95 cursor-pointer`}
            style={{
              animation: hoveredIndex === index ? 'bounce 0.6s ease-in-out infinite' : 'none',
            }}
          >
            {reaction.emoji}
          </div>
          {/* Tooltip */}
          <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-semibold shadow-lg">
            {reaction.label}
          </span>
        </button>
      ))}
      
      <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}