'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { HomeActivityProvider } from '@/contexts/HomeActivityContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { SplashScreen } from './SplashScreen';
import { PageProgressBar } from './PageProgressBar';
import { useState, useEffect } from 'react';

function ProvidersContent({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  
  // Show splash when session is loading
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [sessionCheckTimeout, setSessionCheckTimeout] = useState(false);

  useEffect(() => {
    // When status changes from loading to anything else, hide splash after a short delay
    if (status !== 'loading') {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Force hide splash after 5 seconds max on mobile (prevent indefinite loading on slow networks)
  useEffect(() => {
    const maxWaitTime = setTimeout(() => {
      if (isInitialLoad) {
        console.warn('Session check timeout - forcing splash screen to hide');
        setSessionCheckTimeout(true);
        setIsInitialLoad(false);
      }
    }, 5000);

    return () => clearTimeout(maxWaitTime);
  }, [isInitialLoad]);

  return (
    <>
      <SplashScreen isLoading={isInitialLoad} />
      <PageProgressBar />
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
            <ProvidersContent>{children}</ProvidersContent>
          </HomeActivityProvider>
        </LanguageProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}