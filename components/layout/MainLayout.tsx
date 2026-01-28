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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex flex-1">
        {/* Desktop Sidebar - Always visible on large screens, fixed position */}
        <div className="hidden lg:block w-64 fixed left-0 top-16 bottom-0 z-40">
          <Sidebar />
        </div>
        
        {/* Mobile Sidebar - Full screen overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" 
               onClick={() => setSidebarOpen(false)} />
        )}
        <div className={`fixed left-0 top-16 bottom-0 w-64 z-40 lg:hidden transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content - Adjust margin only on desktop */}
        <main className="flex-1 lg:ml-64 p-3 sm:p-4 lg:p-6 w-full overflow-auto">
          <div className="max-w-4xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}