import React, { useState } from 'react';
import { X, Send, CheckCircle } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { useLanguage } from '@/contexts/LanguageContext';

interface SendMessageRequestProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  isOpen: boolean;
  onClose: () => void;
  onSend: (content: string) => Promise<void>;
}

export function SendMessageRequestModal({
  recipientId,
  recipientName,
  recipientAvatar,
  isOpen,
  onClose,
  onSend,
}: SendMessageRequestProps) {
  const { translation } = useLanguage();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!content.trim()) {
      setError(translation.message?.enterMessage || 'Please enter a message');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      await onSend(content);
      setSuccess(true);
      setContent('');
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : translation.message?.messageRequest || 'Failed to send message request'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-8 text-center border border-gray-200 dark:border-gray-700">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary-light dark:from-primary-dark dark:to-primary flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {translation.message?.messageSent || 'Message Sent!'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {translation.message?.messageRequestSentDesc?.replace('{name}', recipientName) || 
              `Your message request has been sent. ${recipientName} will receive a notification.`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {translation.message?.sendMessageRequest || 'Send Message'}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Recipient Info */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <Avatar
            src={recipientAvatar}
            alt={recipientName}
            userId={recipientId}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-gray-900 dark:text-white truncate">
              {recipientName}
            </p>
          </div>
        </div>

        {/* Message Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {translation.message?.yourMessage || 'Your Message'}
          </label>
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setError(null);
            }}
            placeholder={translation.message?.writeMessagePlaceholder || "Write a message to introduce yourself..."}
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:focus:ring-accent disabled:opacity-50 disabled:cursor-not-allowed resize-none"
            rows={4}
          />
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {content.length}/500
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg text-sm border border-red-200 dark:border-red-800">
            {error}
          </div>
        )}

        {/* Info Box */}
        <div className="mb-6 p-3 bg-gradient-to-r from-primary/10 to-accent/10 dark:from-primary-dark/20 dark:to-accent/20 rounded-lg border border-primary/20 dark:border-primary-dark/30">
          <p className="text-xs text-primary dark:text-accent font-medium">
            💡 {translation.message?.whenAccepts?.replace('{name}', recipientName) || 
              `When ${recipientName} accepts your request, you'll become friends and can message freely.`}
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {translation.common?.cancel || 'Cancel'}
          </button>
          <button
            onClick={handleSend}
            disabled={isLoading || !content.trim()}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-primary to-primary-light dark:from-primary-dark dark:to-primary text-white hover:from-primary-light hover:to-primary-light dark:hover:from-primary dark:hover:to-primary-light disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-sm"
          >
            <Send size={16} />
            {isLoading ? translation.common?.loading || 'Sending...' : (translation.message?.sendRequest || 'Send Request')}
          </button>
        </div>
      </div>
    </div>
  );
}
