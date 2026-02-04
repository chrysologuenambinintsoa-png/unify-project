'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function ThemeToggle() {
  const { theme, setTheme, isDark } = useTheme();

  const themes: Array<{ value: 'light' | 'dark' | 'auto'; label: string; icon: React.ReactNode }> = [
    {
      value: 'light',
      label: 'Clair',
      icon: <Sun className="w-4 h-4" />,
    },
    {
      value: 'dark',
      label: 'Sombre',
      icon: <Moon className="w-4 h-4" />,
    },
    {
      value: 'auto',
      label: 'Auto',
      icon: <Zap className="w-4 h-4" />,
    },
  ];

  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-1">
      {themes.map((t) => (
        <motion.button
          key={t.value}
          onClick={() => setTheme(t.value)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-300 ${
            theme === t.value
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-white shadow-lg'
              : 'text-white/60 hover:text-white/80'
          }`}
          title={t.label}
        >
          {t.icon}
          <span className="hidden sm:inline text-sm font-medium">{t.label}</span>
        </motion.button>
      ))}
    </div>
  );
}
