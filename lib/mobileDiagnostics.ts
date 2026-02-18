'use client';

/**
 * Diagnostic tool for mobile rendering issues
 * Add this to your layout or a debug component to see real-time diagnostics
 */

export const initMobileDiagnostics = () => {
  if (typeof window === 'undefined') return;

  // Log immediately when page loads
  console.log('=== UNIFY MOBILE DIAGNOSTICS ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('User Agent:', navigator.userAgent);
  console.log('Viewport:', {
    width: window.innerWidth,
    height: window.innerHeight,
    documentWidth: document.documentElement.clientWidth,
    documentHeight: document.documentElement.clientHeight,
  });

  // Check for common issues
  const checkDOM = () => {
    const root = document.documentElement;
    const body = document.body;
    const html = document.querySelector('html');
    
    console.log('=== DOM CHECKS ===');
    console.log('HTML Element:', {
      classes: html?.className,
      childCount: html?.children.length,
      computedStyle: html ? window.getComputedStyle(html).backgroundColor : 'N/A',
    });
    
    console.log('Body Element:', {
      classes: body.className,
      childCount: body.children.length,
      computedStyle: window.getComputedStyle(body).backgroundColor,
      computedColor: window.getComputedStyle(body).color,
    });

    // Check for key components
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    const nav = document.querySelector('nav');
    
    console.log('=== KEY COMPONENTS ===');
    console.log('Header:', {
      found: !!header,
      visible: header ? window.getComputedStyle(header).display !== 'none' : 'N/A',
      height: header ? header.clientHeight : 'N/A',
    });
    
    console.log('Main:', {
      found: !!main,
      visible: main ? window.getComputedStyle(main).display !== 'none' : 'N/A',
      height: main ? main.clientHeight : 'N/A',
    });
    
    console.log('Nav:', {
      found: !!nav,
      visible: nav ? window.getComputedStyle(nav).display !== 'none' : 'N/A',
    });

    // Check for splash screen
    const splash = document.querySelector('[class*="fixed"][class*="inset"]');
    if (splash?.textContent?.includes('Unify')) {
      console.log('⚠️ SPLASH SCREEN DETECTED - Might be stuck');
    }
  };

  checkDOM();

  // Log all console errors
  const originalError = console.error;
  console.error = function(...args) {
    console.warn('❌ CONSOLE ERROR:', ...args);
    originalError.apply(console, args);
  };

  // Check for hydration mismatches
  window.addEventListener('error', (event) => {
    if (event.message.includes('hydration')) {
      console.error('🔴 HYDRATION ERROR DETECTED:', event.message);
    }
  });

  // Periodically check rendering
  setInterval(() => {
    const main = document.querySelector('main');
    if (main && main.children.length === 0) {
      console.warn('⚠️ Main element is empty - content not rendering');
    }
  }, 5000);
};

// Auto-initialize if needed
if (typeof window !== 'undefined') {
  // Safe to initialize after small delay to ensure DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileDiagnostics);
  } else {
    initMobileDiagnostics();
  }
}
