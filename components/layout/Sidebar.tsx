'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Bell, Mail, Users, Settings, LogOut, Users2, Flag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { href: '/', icon: Home, labelKey: 'nav.home' },
  { href: '/explore', icon: Search, labelKey: 'nav.explore' },
  { href: '/notifications', icon: Bell, labelKey: 'nav.notifications' },
  { href: '/messages', icon: Mail, labelKey: 'nav.messages' },
  { href: '/friends', icon: Users, labelKey: 'friends.friends' },
  { href: '/groups', icon: Users2, labelKey: 'nav.groups' },
  { href: '/pages', icon: Flag, labelKey: 'nav.pages' },
  { href: '/settings', icon: Settings, labelKey: 'settings.settings' },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname();
  const { translation } = useLanguage();

  const getTranslation = (key: string) => {
    const keys = key.split('.');
    let value: any = translation;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-primary-dark text-white overflow-y-auto z-40">
      <nav className="p-3 sm:p-4 space-y-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const label = getTranslation(item.labelKey);

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base',
                  'hover:bg-primary-light',
                  isActive
                    ? 'bg-accent-dark text-white shadow-lg'
                    : 'text-blue-100 hover:text-white'
                )}
              >
                <Icon className={cn('w-5 sm:w-6 h-5 sm:h-6 flex-shrink-0', isActive && 'scale-110')} />
                <span className="font-medium">{label}</span>
              </Link>
            </motion.div>
          );
        })}

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Link
            href="/auth/logout"
            onClick={onClose}
            className="flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 hover:bg-primary-light text-blue-100 hover:text-white text-sm sm:text-base"
          >
            <LogOut className="w-5 sm:w-6 h-5 sm:h-6 flex-shrink-0" />
            <span className="font-medium">{translation.auth.logout}</span>
          </Link>
        </motion.div>
      </nav>

      {/* Bottom Section */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 border-t border-blue-800">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-accent-dark text-white rounded-lg sm:rounded-xl font-medium text-sm sm:text-base hover:bg-accent-light transition-colors shadow-lg"
        >
          {translation.post.createPost}
        </motion.button>
      </div>
    </aside>
  );
}