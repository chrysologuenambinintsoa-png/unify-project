'use client';

import { SessionProvider, useSession } from 'next-auth/react';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { HomeActivityProvider } from '@/contexts/HomeActivityContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/hooks/useToast';
import { PageProgressBar } from './PageProgressBar';
import { ToastContainer } from './ToastContainer';
import { SplashScreenWrapper } from './SplashScreenWrapper';
import { useEffect, useState } from 'react';

function ProvidersContent({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const [isInitializing, setIsInitializing] = useState(true);

  // Afficher le splash screen au premier chargement (loading initial)
  useEffect(() => {
    if (status !== 'loading') {
      const timer = setTimeout(() => {
        setIsInitializing(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <>
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