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
  
  // Show splash only if loading or unauthenticated (never for authenticated sessions)
  const shouldShowSplash = status === 'loading';
  const [isInitialLoad, setIsInitialLoad] = useState(!shouldShowSplash);

  useEffect(() => {
    // When status changes from loading to anything else, hide splash
    if (status !== 'loading') {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status]);

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