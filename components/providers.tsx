'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { SplashScreen } from './SplashScreen';
import { useState, useEffect } from 'react';

function ProvidersContent({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
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
      {children}
    </>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LanguageProvider>
        <ProvidersContent>{children}</ProvidersContent>
      </LanguageProvider>
    </SessionProvider>
  );
}