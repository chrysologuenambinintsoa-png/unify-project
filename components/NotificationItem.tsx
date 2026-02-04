"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

interface NotificationItemProps {
  id: string;
  type: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar: string | null;
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
  actionLink = "/",
}: NotificationItemProps) {
  const handleClick = () => {
    if (!read && onRead) onRead(id);
  };

  const formatTime = (timeString: string) => {
    const date = new Date(timeString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "À l'instant";
    if (diffInSeconds < 3600) return `Il y a ${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `Il y a ${Math.floor(diffInSeconds / 3600)}h`;
    return `Il y a ${Math.floor(diffInSeconds / 86400)}j`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="w-full"
    >
      <Link href={actionLink}>
        <div
          onClick={handleClick}
          className={`px-4 py-3 transition-all duration-200 flex items-start gap-3 ${
            read ? "hover:bg-gray-50" : "bg-blue-50 hover:bg-blue-100"
          }`}
        >
          <div className="relative w-10 h-10 flex-shrink-0 mt-0.5">
            <Image
              src={user.avatar || "/default-avatar.png"}
              alt={user.fullName}
              fill
              className="rounded-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-900">
              <span className="font-semibold">{user.fullName}</span>
              <span className="text-gray-700 ml-1">{content}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">{formatTime(time)}</p>
          </div>

          {!read && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1"
            />
          )}
        </div>
      </Link>
    </motion.div>
  );
}

export default NotificationItem;
