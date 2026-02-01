'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Search, Bell, Mail, Users, Settings, LogOut, Users2, Flag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useHomeActivity } from '@/contexts/HomeActivityContext';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useBadges } from '@/hooks/useBadges';
import { SidebarBadge } from '@/components/SidebarBadge';
import { SidebarUser } from '@/components/layout/SidebarUser';

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
  const { badges } = useBadges();
  const { homeActivityCount } = useHomeActivity();

  const getTranslation = (key: string) => {
    const keys = key.split('.');
    let value: any = translation;
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <aside className="w-full h-full bg-primary-dark text-white overflow-y-auto overflow-x-hidden flex flex-col pb-20 sm:pb-32">
      <nav className="p-3 sm:p-4 space-y-2 flex-1 w-full">{navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          const label = getTranslation(item.labelKey);

          // Déterminer le badge à afficher selon la route
          let badgeCount = 0;
          if (item.href === '/') badgeCount = homeActivityCount;
          else if (item.href === '/notifications') badgeCount = badges.notifications;
          else if (item.href === '/messages') badgeCount = badges.messages;
          else if (item.href === '/friends') badgeCount = badges.friends;
          else if (item.href === '/groups') badgeCount = badges.groups;

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="w-full"
            >
              <Link
                href={item.href}
                onClick={onClose}
                className={cn(
                  'relative flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 text-sm sm:text-base w-full',
                  'hover:bg-primary-light',
                  isActive
                    ? 'bg-accent-dark text-white shadow-lg'
                    : 'text-blue-100 hover:text-white'
                )}
              >
                <Icon className={cn('w-5 sm:w-6 h-5 sm:h-6 flex-shrink-0', isActive && 'scale-110')} />
                <span className="font-medium">{label}</span>
                
                {/* Badge */}
                <AnimatePresence>
                  {badgeCount > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="ml-auto"
                    >
                      <SidebarBadge
                        count={badgeCount}
                        variant={badgeCount > 0 ? 'error' : 'default'}
                        size="sm"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Link>
            </motion.div>
          );
        })}

        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="w-full"
        >
          <Link
            href="/auth/logout"
            onClick={onClose}
            className="flex items-center space-x-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg sm:rounded-xl transition-all duration-200 hover:bg-primary-light text-blue-100 hover:text-white text-sm sm:text-base w-full"
          >
            <LogOut className="w-5 sm:w-6 h-5 sm:h-6 flex-shrink-0" />
            <span className="font-medium">{translation.auth.logout}</span>
          </Link>
        </motion.div>
      </nav>

      {/* User Section */}
      <SidebarUser />
    </aside>
  );
}