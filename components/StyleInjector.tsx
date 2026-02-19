'use client';

import { useEffect } from 'react';

/**
 * This component ensures CSS is properly applied on real mobile devices
 * by injecting critical styles into the DOM if they're not found
 */
export function StyleInjector() {
  useEffect(() => {
    // Check if styles are applied
    const htmlElement = document.documentElement;
    const computedStyle = window.getComputedStyle(htmlElement);
    const isDark = htmlElement.classList.contains('dark');
    
    // Get current background color
    const bgColor = computedStyle.backgroundColor;
    const textColor = computedStyle.color;
    
    // Check if we're in a problematic state (gray background = #808080 or similar)
    const isGray = bgColor.includes('128') || bgColor === 'rgb(128, 128, 128)';
    
    if (isGray) {
      // Force styles
      if (isDark) {
        htmlElement.style.backgroundColor = '#0f172a';
        htmlElement.style.color = '#ffffff';
        document.body.style.backgroundColor = '#0f172a';
        document.body.style.color = '#ffffff';
      } else {
        htmlElement.style.backgroundColor = '#ffffff';
        htmlElement.style.color = '#000000';
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#000000';
      }
    }
    
    // Verify CSS variables
    const bgVar = computedStyle.getPropertyValue('--background-rgb').trim();
    const fgVar = computedStyle.getPropertyValue('--foreground-rgb').trim();
    
    if (!bgVar || !fgVar) {
      // Set CSS variables if missing
      htmlElement.style.setProperty('--background-rgb', isDark ? '15, 23, 42' : '255, 255, 255');
      htmlElement.style.setProperty('--foreground-rgb', isDark ? '255, 255, 255' : '0, 0, 0');
      htmlElement.style.setProperty('--border-rgb', isDark ? '51, 65, 85' : '229, 231, 235');
    }
  }, []);

  return null;
}
