'use client';

import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    console.log('[MainLayout] Client mounted - ready to render content');
  }, []);

  if (renderError) {
    return (
      <div className="w-screen min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-950 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 max-w-md">
          <h1 className="text-red-600 dark:text-red-400 font-bold mb-2">Erreur de Rendu</h1>
          <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">{renderError}</p>
          <button
            onClick={() => {
              setRenderError(null);
              window.location.reload();
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm"
          >
            Recharger la page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <ErrorBoundary onError={(error) => setRenderError(error.message)}>
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      </ErrorBoundary>
      
      <div className="flex flex-1 w-full pt-16 overflow-hidden">
        {/* Desktop Sidebar - Fixed */}
        <nav className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 bg-primary-dark text-white fixed left-0 top-16 bottom-0 overflow-y-auto z-40">
          <ErrorBoundary onError={(error) => setRenderError(error.message)}>
            <Sidebar />
          </ErrorBoundary>
        </nav>
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-[99997] bg-black/50 lg:hidden" 
            onClick={() => setSidebarOpen(false)} 
          />
        )}
        <nav className={`fixed left-0 top-16 bottom-0 w-3/4 max-w-xs bg-primary-dark text-white z-[99998] lg:hidden transition-transform duration-300 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <ErrorBoundary onError={(error) => setRenderError(error.message)}>
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </ErrorBoundary>
        </nav>

        {/* Main Content - Full width on mobile, offset by sidebar on desktop */}
        <main className="flex-1 w-full lg:ml-64 overflow-y-auto bg-white dark:bg-gray-800">
          <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6 py-4">
            <div className="w-full max-w-5xl mx-auto">
              <ErrorBoundary onError={(error) => setRenderError(error.message)}>
                {isClient ? children : <div className="text-gray-500 text-center py-8">Chargement...</div>}
              </ErrorBoundary>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/**
 * Simple Error Boundary component to catch render errors
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary] Caught error:', error);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="text-red-600 dark:text-red-400 p-4 bg-red-50 dark:bg-red-950/20 rounded-lg m-4">
          <strong>Erreur:</strong> {this.state.error?.message}
          <br />
          <small className="text-xs text-gray-600 dark:text-gray-400">
            Vérifiez la console du navigateur (F12) pour plus de détails
          </small>
        </div>
      );
    }

    return this.props.children;
  }
}