'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Avatar } from '@/components/ui/Avatar';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageSquare, UserPlus, X } from 'lucide-react';

interface MessageRequest {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    fullName: string;
    avatar?: string;
  };
  createdAt: string;
}

interface MessageRequestBubbleProps {
  request: MessageRequest;
  isLoading?: boolean;
  onAccept: (messageId: string) => Promise<void>;
  onReject: (messageId: string) => Promise<void>;
}

export const MessageRequestBubble: React.FC<MessageRequestBubbleProps> = ({
  request,
  isLoading = false,
  onAccept,
  onReject,
}) => {
  const { translation } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  const handleAccept = async () => {
    try {
      setError(null);
      await onAccept(request.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept request');
    }
  };

  const handleReject = async () => {
    try {
      setError(null);
      await onReject(request.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="mx-4 my-4"
    >
      <div className="bg-gradient-to-r from-primary/5 to-accent/5 dark:from-primary-dark/20 dark:to-accent/20 rounded-2xl border border-primary/20 dark:border-primary-dark/30 overflow-hidden shadow-md">
        {/* Header with icon */}
        <div className="px-6 py-4 border-b border-primary/20 dark:border-primary-dark/30 flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            <div className="p-2 bg-gradient-to-br from-primary to-primary-light dark:from-primary-dark dark:to-primary rounded-full">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
              {translation.message?.messageRequest || 'Message Request'}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {translation.message?.messageRequestInfo || 'Message request from a non-friend'}
            </p>
          </div>
        </div>

        {/* Sender Info */}
        <div className="px-6 py-4 border-b border-primary/20 dark:border-primary-dark/30">
          <div className="flex items-center gap-3">
            <Avatar
              src={request.sender.avatar}
              alt={request.sender.fullName}
              userId={request.sender.id}
              size="md"
            />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                {request.sender.fullName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                @{request.sender.username}
              </p>
            </div>
          </div>
        </div>

        {/* Message Content */}
        <div className="px-6 py-4 border-b border-primary/20 dark:border-primary-dark/30">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">
            {translation.message?.typeMessage || 'Message'}
          </p>
          <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-primary/10 dark:border-primary-dark/20">
            <p className="text-gray-900 dark:text-gray-100 text-sm break-words">
              {request.content}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Action Buttons */}
        <div className="px-6 py-4 flex gap-3">
          <button
            onClick={handleReject}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2"
          >
            <X size={16} />
            {isLoading ? (translation.common?.loading || 'Loading...') : (translation.message?.decline || 'Decline')}
          </button>
          <button
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-primary to-primary-light dark:from-primary-dark dark:to-primary text-white hover:from-primary-light hover:to-primary-light dark:hover:from-primary dark:hover:to-primary-light disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 font-medium text-sm flex items-center justify-center gap-2 shadow-sm"
          >
            <UserPlus size={16} />
            {isLoading ? (translation.common?.loading || 'Loading...') : (translation.message?.acceptAndFriend || 'Accept & Friend')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
