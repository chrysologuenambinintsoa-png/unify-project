'use client';

import React, { useState, useRef, useEffect } from 'react';
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
  const menuRef = useRef<HTMLDivElement>(null);
  const { translation } = useLanguage();

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut({ redirect: false });
    router.push('/welcome');
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

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full hover:ring-2 hover:ring-primary-dark transition-all"
      >
        <Avatar
          src={session.user.avatar}
          name={session.user.fullName || session.user.username}
          size="sm"
        />
      </motion.button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50"
            style={{ pointerEvents: isOpen ? 'auto' : 'none' }}
          >
            {/* User Info Header */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-900">
                {session.user.fullName || session.user.username}
              </p>
              {session.user.email && (
                <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
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
    </div>
  );
}
