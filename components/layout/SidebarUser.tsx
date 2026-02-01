'use client';

import React from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useBadges } from '@/hooks/useBadges';
import { SidebarBadge } from '@/components/SidebarBadge';

export function SidebarUser() {
  const { data: session } = useSession();
  const { badges } = useBadges();

  if (!session?.user) return null;

  const totalBadges = badges.messages + badges.notifications;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="p-3 sm:p-4 border-t border-primary-light mt-4 w-full"
    >
      <Link
        href="/settings"
        className="flex items-center space-x-3 p-2 sm:p-3 rounded-lg hover:bg-primary-light transition-all duration-200 group w-full"
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-accent-dark group-hover:border-accent-light transition-colors">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name || 'User'}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                {session.user.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
          </div>

          {/* Badge total */}
          {totalBadges > 0 && (
            <SidebarBadge
              count={totalBadges}
              variant="error"
              size="sm"
              animate={true}
            />
          )}
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0 truncate">
          <p className="text-white font-bold text-sm truncate group-hover:text-accent-light transition-colors">
            {session.user.name || 'User'}
          </p>
          <p className="text-blue-200 text-xs truncate group-hover:text-accent-light transition-colors">
            @{session.user.email?.split('@')[0] || 'user'}
          </p>
        </div>

        {/* Indicator */}
        <div className="flex-shrink-0 text-gray-400 group-hover:text-accent-dark transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>
    </motion.div>
  );
}

export default SidebarUser;
