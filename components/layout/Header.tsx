'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Bell, Mail, Settings, Menu } from 'lucide-react';
import LiveIcon from '@/components/layout/LiveIcon';
import { Badge } from '@/components/ui/Badge';
import { SearchBar } from '@/components/SearchBar';
import { UserMenu } from '@/components/layout/UserMenu';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUnreadCounts } from '@/hooks/useUnreadCounts';
import { motion } from 'framer-motion';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession();
  const { translation } = useLanguage();
  const { counts } = useUnreadCounts();

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] bg-white shadow-sm">
      <div className="px-2 sm:px-4 lg:px-8 h-16">
        <div className="flex items-center justify-between h-full gap-1 sm:gap-4">
          {/* Menu Button - Mobile Only */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onMenuClick}
            className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
          </motion.button>

          {/* Logo */}
          <Link href="/" className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-8 sm:w-10 h-8 sm:h-10 flex items-center justify-center"
            >
              <img src="/logo.svg" alt="Unify" className="w-full h-full" />
            </motion.div>
            <span className="text-lg sm:text-xl lg:text-2xl font-bold text-primary-dark hidden sm:block">
              Unify
            </span>
          </Link>

          {/* Search Bar - Hidden on small mobile */}
          <div className="hidden sm:flex flex-1 max-w-sm">
            <SearchBar />
          </div>

          {/* Navigation Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <nav className="flex items-center space-x-1 sm:space-x-2">
              <Link href="/messages">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-1.5 rounded-full bg-primary-dark hover:bg-primary-dark/80 transition-colors"
                >
                  <Mail className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                  <Badge count={counts.messages} />
                </motion.button>
              </Link>

              <Link href="/notifications">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-1.5 rounded-full bg-primary-dark hover:bg-primary-dark/80 transition-colors"
                >
                  <Bell className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                  <Badge count={counts.notifications} />
                </motion.button>
              </Link>

              <Link href="/live">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-1.5 rounded-full bg-primary-dark hover:bg-primary-dark/80 transition-colors"
                >
                  <LiveIcon />
                </motion.button>
              </Link>

              <Link href="/settings">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className="relative p-1.5 rounded-full bg-primary-dark hover:bg-primary-dark/80 transition-colors"
                >
                  <Settings className="w-5 sm:w-6 h-5 sm:h-6 text-white" />
                </motion.button>
              </Link>
            </nav>

            {/* User Menu */}
            <div className="relative flex-shrink-0">
              <UserMenu />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}