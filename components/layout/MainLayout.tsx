'use client';

import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="w-full h-screen flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1 w-full pt-16 overflow-hidden">
        {/* Desktop Sidebar - Fixed */}
        <nav className="hidden lg:flex lg:flex-col w-64 flex-shrink-0 bg-primary-dark text-white fixed left-0 top-16 bottom-0 overflow-y-auto">
          <Sidebar />
        </nav>
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-[99997] bg-black/50 lg:hidden" 
               onClick={() => setSidebarOpen(false)} />
        )}
        <nav className={`fixed left-0 top-16 bottom-0 w-3/4 max-w-xs bg-primary-dark z-[99998] lg:hidden transition-transform duration-300 overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </nav>

        {/* Main Content - Full width on mobile, offset by sidebar on desktop */}
        <main className="flex-1 w-full lg:ml-64 overflow-y-auto bg-gray-50 dark:bg-gray-950">
          <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6 py-4">
            <div className="w-full max-w-5xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}