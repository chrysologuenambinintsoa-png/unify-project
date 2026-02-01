'use client';

import React from 'react';
import { Bell, MessageCircle, UserPlus, AtSign } from 'lucide-react';
import { HeartIcon } from '@/components/HeartIcon';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

interface NotificationItemProps {
  id: string;
  type: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  content: string;
  time: string;
  read: boolean;
  onRead?: (notificationId: string) => void;
  actionLink?: string;
}

export function NotificationItem({
  id,
  type,
  user,
  content,
  time,
  read,
  onRead,
  actionLink = '/'
}: NotificationItemProps) {
  const handleClick = async () => {
    if (!read && onRead) {
      onRead(id);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <HeartIcon className="w-5 h-5" fill={true} />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-500" />;
      case 'follow':
        return <UserPlus className="w-5 h-5 text-green-500" />;
      case 'mention':
        return <AtSign className="w-5 h-5 text-purple-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'À l\'instant';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes}m`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours}h`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days}j`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01, x: 4 }}
      className="cursor-pointer"
    >
      <Link href={actionLink}>
        <div
          onClick={handleClick}
          className={`p-4 rounded-lg border transition-all duration-300 ${
            read
              ? 'bg-white border-gray-200 hover:bg-gray-50'
              : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
          }`}
        >
          <div className="flex items-start space-x-3">
            {/* Icon */}
            <div className="flex-shrink-0 mt-1">
              <motion.div
                animate={!read ? { scale: [1, 1.2, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {getNotificationIcon(type)}
              </motion.div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  {/* User Avatar + Info */}
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="relative w-8 h-8 flex-shrink-0">
                      <Image
                        src={user.avatar || '/default-avatar.png'}
                        alt={user.fullName}
                        fill
                        className="rounded-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-semibold text-gray-900">
                          {user.fullName}
                        </span>
                        <span className="text-gray-600 ml-1">{content}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(time)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Unread indicator */}
                {!read && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export default NotificationItem;
