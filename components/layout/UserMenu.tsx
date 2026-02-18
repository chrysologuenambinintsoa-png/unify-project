'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { LogOut, Settings, User } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';

export function UserMenu() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const { translation } = useLanguage();
  const [portalStyle, setPortalStyle] = useState<React.CSSProperties | null>(null);

  // Close menu when clicking outside (checks both anchor and portal)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        containerRef.current && containerRef.current.contains(target)
      ) {
        return;
      }
      if (dropdownRef.current && dropdownRef.current.contains(target)) {
        return;
      }
      setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute portal position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      const top = Math.round(r.bottom + 4);
      const right = Math.round(window.innerWidth - r.right + 8);
      setPortalStyle({ position: 'fixed', top: `${top}px`, right: `${right}px` });
    } else {
      setPortalStyle(null);
    }
  }, [isOpen]);

  const handleLogout = async () => {
    setIsOpen(false);
    router.push('/auth/logout');
  };

  // Show login button if not authenticated or still loading
  if (status === 'unauthenticated') {
    return (
      <Link href="/auth/login">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-3 sm:px-4 py-2 text-sm bg-primary-dark text-white rounded-lg hover:bg-primary-light transition-colors"
        >
          {translation.auth.login}
        </motion.button>
      </Link>
    );
  }

  // Loading state
  if (status === 'loading') {
    return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (!session?.user) {
    return null;
  }

  const dropdown = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={(el) => { dropdownRef.current = el; }}
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.12 }}
          className="w-44 sm:w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-[100000]"
          style={{ 
            position: 'fixed',
            pointerEvents: 'auto',
            ...portalStyle
          }}
        >
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900">
              {session.user.fullName || session.user.username}
            </p>
            {session.user.username && (
              <p className="text-xs text-gray-500 truncate">@{session.user.username}</p>
            )}
          </div>

          {/* Menu Items */}
          <nav className="py-2">
            {/* Profile Link */}
            <Link href={`/users/${session.user.id}/profile`} className="block">
              <motion.button
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
              >
                <User className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Profile</span>
              </motion.button>
            </Link>

            {/* Settings Link */}
            <Link href="/settings" className="block">
              <motion.button
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Settings</span>
              </motion.button>
            </Link>

            {/* Logout Button */}
            <motion.button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 mt-2 pt-2 w-full"
            >
              <LogOut className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Logout</span>
            </motion.button>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Avatar Button */}
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full bg-primary-dark dark:bg-primary-dark hover:bg-primary-light dark:hover:bg-primary-light transition-all"
      >
        <Avatar
          src={session.user.avatar || null}
          name={session.user.fullName || session.user.username}
          userId={session.user.id}
          size="sm"
        />
      </motion.button>

      {/* Portal the dropdown to document.body so it sits above other overlays */}
      {typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  );
}
