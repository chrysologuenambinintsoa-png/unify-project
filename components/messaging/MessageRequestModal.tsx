import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

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

interface MessageRequestModalProps {
  request: MessageRequest;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (messageId: string) => Promise<void>;
  onReject: (messageId: string) => Promise<void>;
}

export function MessageRequestModal({
  request,
  isOpen,
  onClose,
  onAccept,
  onReject,
}: MessageRequestModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAccept = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onAccept(request.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept request');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onReject(request.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Message Request
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sender Info */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-slate-700">
          <Avatar
            src={request.sender.avatar}
            alt={request.sender.fullName}
            userId={request.sender.id}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {request.sender.fullName}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
              @{request.sender.username}
            </p>
          </div>
        </div>

        {/* Message Content */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Message</p>
          <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
            <p className="text-gray-900 dark:text-gray-100 text-sm break-words">
              {request.content}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleReject}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Processing...' : 'Decline'}
          </button>
          <button
            onClick={handleAccept}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? 'Processing...' : 'Accept & Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}
