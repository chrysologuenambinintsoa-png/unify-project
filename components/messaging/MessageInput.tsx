'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Paperclip, Smile, X } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';

interface MessageInputProps {
  onSendMessage: (content: string, attachments?: { type: 'image' | 'file'; data: string; name?: string }[]) => void;
  onTyping?: (isTyping: boolean) => void;
  currentUserAvatar: string;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content?: string;
  image?: string;
  timestamp: Date;
  isRead: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onTyping,
  currentUserAvatar,
  replyingTo,
  onCancelReply,
}) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<{ type: 'image' | 'file'; data: string; name?: string }[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;

    setIsLoading(true);
    try {
      onSendMessage(message, attachments);
      setMessage('');
      setAttachments([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = event.target?.result as string;
      setAttachments([...attachments, {
        type,
        data,
        name: file.name,
      }]);
    };
    reader.readAsDataURL(file);
  };

  const handleEmojiClick = (emoji: string) => {
    setMessage(message + emoji);
  };

  return (
    <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 shadow-lg">
      {/* Reply Preview */}
      <AnimatePresence>
        {replyingTo && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 p-3 bg-primary/10 dark:bg-primary-dark/20 border-l-4 border-primary dark:border-accent rounded-lg flex items-center justify-between gap-2"
          >
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-primary dark:text-accent">
                {replyingTo.senderName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {replyingTo.content || '📷 Photo'}
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCancelReply}
              className="p-1 hover:bg-primary/20 rounded transition-colors flex-shrink-0"
              title="Annuler la réponse"
            >
              <X className="w-4 h-4 text-primary dark:text-accent" />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachments Preview */}
      <AnimatePresence>
        {attachments.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-3 flex gap-2 overflow-x-auto pb-3"
          >
            {attachments.map((attachment, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="relative flex-shrink-0 group"
              >
                {attachment.type === 'image' ? (
                  <img
                    src={attachment.data}
                    alt="preview"
                    className="h-20 w-20 object-cover rounded-lg"
                  />
                ) : (
                  <div className="h-20 w-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden">
                    <span className="text-xs text-center px-2 text-gray-900 dark:text-white font-medium truncate">
                      {attachment.name}
                    </span>
                  </div>
                )}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))}
                  className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </motion.button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* User Avatar */}
        <img
          src={currentUserAvatar}
          alt="Your avatar"
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
        />

        {/* Input Container */}
        <div className="flex-1 flex items-end gap-2">
          {/* Text Input */}
          <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <input
              type="text"
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                // Notify parent that user is typing
                onTyping?.(true);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !isLoading) {
                  // Notify parent that user stopped typing
                  onTyping?.(false);
                  handleSend();
                }
              }}
              onBlur={() => {
                // Notify parent that user stopped typing when focus is lost
                onTyping?.(false);
              }}
              placeholder="Aa"
              className="flex-1 bg-transparent outline-none text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />

            {/* Emoji Button */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
              >
                <Smile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>

              {/* Emoji Picker */}
              <AnimatePresence>
                {showEmojiPicker && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: 10 }}
                    className="fixed md:absolute bottom-20 md:bottom-full right-4 md:right-0 md:-right-6 mb-0 md:mb-2 z-[9999] pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-white dark:bg-gray-700 rounded-xl shadow-2xl border-2 border-gray-200 dark:border-gray-600 p-4 backdrop-blur-sm min-w-[320px] sm:min-w-[360px] md:min-w-[380px]">
                      <div className="grid grid-cols-7 sm:grid-cols-8 gap-3 sm:gap-4">
                        {['😀', '😂', '😍', '😮', '🤔', '😢', '🔥', '👍', '❤️', '🎉', '💯', '✨', '🚀', '😎', '💪', '🙏'].map((emoji, idx) => (
                          <motion.button
                            key={`emoji-${idx}`}
                            whileHover={{ scale: 1.2, y: -2 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => {
                              handleEmojiClick(emoji);
                              setShowEmojiPicker(false);
                            }}
                            className="text-2xl sm:text-3xl hover:bg-gray-100 dark:hover:bg-gray-600 p-2 sm:p-2.5 rounded-lg transition-colors flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 whitespace-nowrap hover:shadow-md"
                          >
                            {emoji}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Attachment Buttons */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e, 'image')}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            onChange={(e) => handleFileSelect(e, 'file')}
            className="hidden"
          />

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => imageInputRef.current?.click()}
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Partager une photo"
          >
            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            title="Partager un fichier"
          >
            <Paperclip className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </motion.button>

          {/* Send Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!message.trim() && attachments.length === 0 || isLoading}
            className="p-2.5 bg-gradient-to-r from-primary-dark to-blue-700 hover:from-primary-dark hover:to-blue-800 text-white rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};
