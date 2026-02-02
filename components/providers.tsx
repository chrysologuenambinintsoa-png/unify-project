'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { HomeActivityProvider } from '@/contexts/HomeActivityContext';
import { SplashScreen } from './SplashScreen';
import { useState, useEffect } from 'react';

function ProvidersContent({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    // Only show splash once per browser session. Use sessionStorage to persist flag.
    try {
      const shown = sessionStorage.getItem('unify:splashShown');
      if (shown === '1') {
        setIsInitialLoad(false);
        return;
      }
    } catch (e) {
      // ignore (SSR or restricted storage)
    }

    if (status !== 'loading') {
      const timer = setTimeout(() => {
        try {
          sessionStorage.setItem('unify:splashShown', '1');
        } catch (e) {
          // ignore
        }
        setIsInitialLoad(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <>
      <SplashScreen isLoading={isInitialLoad} />
      {children}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <HomeActivityProvider>
          <ProvidersContent>{children}</ProvidersContent>
        </HomeActivityProvider>
      </LanguageProvider>
    </SessionProvider>
  );
}