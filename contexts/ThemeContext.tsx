'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('auto');
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Initialize theme immediately on first render (critical for mobile)
  useEffect(() => {
    // Prioritize system preference detection early
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('unify-theme') as Theme | null;
        let selectedTheme: Theme = (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) 
          ? (savedTheme as Theme)
          : 'auto';

        // Determine effective theme
        let effectiveTheme: 'light' | 'dark' = selectedTheme === 'auto'
          ? window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
          : (selectedTheme as 'light' | 'dark');

        // Apply immediately (before render)
        const htmlElement = document.documentElement;
        if (effectiveTheme === 'dark') {
          htmlElement.classList.add('dark');
        } else {
          htmlElement.classList.remove('dark');
        }

        // Reset CSS variables
        if (effectiveTheme === 'dark') {
          htmlElement.style.colorScheme = 'dark';
        } else {
          htmlElement.style.colorScheme = 'light';
        }

        setThemeState(selectedTheme);
        setIsDark(effectiveTheme === 'dark');
      } catch (error) {
        console.warn('Theme initialization error:', error);
        // Fallback: detect system preference
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
          setIsDark(true);
        }
      }
    }
    setMounted(true);
  }, []);

  // Apply theme changes
  useEffect(() => {
    if (!mounted) return;

    let effectiveTheme: 'light' | 'dark' = theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : (theme as 'light' | 'dark');

    setIsDark(effectiveTheme === 'dark');
    
    if (typeof document !== 'undefined') {
      const htmlElement = document.documentElement;
      if (effectiveTheme === 'dark') {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
    }

    // Save to localStorage
    try {
      localStorage.setItem('unify-theme', theme);
    } catch (error) {
      console.warn('Could not save theme to localStorage:', error);
    }

    // Persist to backend
    if (typeof fetch !== 'undefined') {
      fetch('/api/settings/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme }),
      }).catch(err => console.debug('Theme sync to server skipped (no auth or offline)'));
    }
  }, [theme, mounted]);

  // Listen for system theme changes
  useEffect(() => {
    if (!mounted || theme !== 'auto' || typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      setIsDark(mediaQuery.matches);
      const htmlElement = document.documentElement;
      if (mediaQuery.matches) {
        htmlElement.classList.add('dark');
      } else {
        htmlElement.classList.remove('dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    if (['light', 'dark', 'auto'].includes(newTheme)) {
      console.log('Setting theme to:', newTheme);
      setThemeState(newTheme);
    } else {
      console.warn('Invalid theme:', newTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
