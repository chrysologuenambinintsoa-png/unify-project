'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { HomeActivityProvider } from '@/contexts/HomeActivityContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/hooks/useToast';
import { PageProgressBar } from './PageProgressBar';
import { ToastContainer } from './ToastContainer';
import { SplashScreenWrapper } from './SplashScreenWrapper';
import { StyleInjector } from './StyleInjector';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

function ProvidersContent({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [isInitializing, setIsInitializing] = useState(true);
  const [cssLoaded, setCssLoaded] = useState(false);
  const pathname = usePathname();

  // Ensure CSS is fully loaded
  useEffect(() => {
    const checkCSS = () => {
      if (document.styleSheets.length > 0) {
        setCssLoaded(true);
      }
    };
    
    // Check immediately and also when DOM is ready
    checkCSS();
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', checkCSS);
      return () => document.removeEventListener('DOMContentLoaded', checkCSS);
    }
  }, []);

  // Afficher le splash screen au premier chargement (loading initial)
  useEffect(() => {
    if (status !== 'loading' && cssLoaded) {
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [status, cssLoaded]);

  // Track last route into sessionStorage so the splash hook can decide
  // whether to show the splash (we avoid showing it right after login/register flows)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (pathname) sessionStorage.setItem('unify:last-route', pathname);
    } catch (e) {
      // ignore sessionStorage errors
    }
  }, [pathname]);

  return (
    <>
      <StyleInjector />
      <PageProgressBar />
      <ToastContainer />
      <SplashScreenWrapper />
      {children}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <LanguageProvider>
          <HomeActivityProvider>
            <ToastProvider>
              <ProvidersContent>{children}</ProvidersContent>
            </ToastProvider>
          </HomeActivityProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}