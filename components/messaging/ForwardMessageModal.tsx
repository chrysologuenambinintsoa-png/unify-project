'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Search } from 'lucide-react';

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage?: string;
  members?: Array<{ id: string; name: string; avatar?: string }>;
  type: 'direct' | 'group';
}

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content?: string;
  timestamp: Date;
  image?: string;
  isRead: boolean;
}

interface ForwardMessageModalProps {
  isOpen: boolean;
  message: Message;
  conversations: Conversation[];
  onClose: () => void;
  onForward: (conversationId: string, message: Message) => Promise<void | boolean>;
  onDelete?: (messageId: string) => void | Promise<void>;
  loading?: boolean;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  message,
  conversations,
  onClose,
  onForward,
  onDelete,
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [forwarding, setForwarding] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    try {
      await onDelete(message.id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const handleForward = async () => {
    if (!selectedConversation) return;

    setForwarding(true);
    try {
      await onForward(selectedConversation, message);
      setSelectedConversation(null);
      setSearchQuery('');
      onClose();
    } finally {
      setForwarding(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-primary-dark text-white p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold">Transférer le message</h3>
              <motion.button
                whileHover={{ rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
            </div>

            {/* Message Preview */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Message original:</p>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Vous
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {message.content || '(pas de contenu texte)'}
                </p>
              </div>
            </div>

            {/* Search Input */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher une conversation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Conversations List */}
            <div className="max-h-80 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                <div className="space-y-1 p-2">
                  {filteredConversations.map((conversation) => (
                    <motion.button
                      key={conversation.id}
                      whileHover={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedConversation(conversation.id)}
                      className={`w-full p-3 rounded-lg transition-all duration-200 flex items-center gap-3 text-left ${
                        selectedConversation === conversation.id
                          ? 'bg-primary/20 border-2 border-primary'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-800 border border-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div className="flex-shrink-0">
                        {conversation.avatar ? (
                          <img
                            src={conversation.avatar}
                            alt={conversation.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold text-sm">
                            {conversation.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>

                      {/* Conversation Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 dark:text-white truncate">
                          {conversation.name}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {conversation.type === 'group'
                            ? `${conversation.members?.length || 0} membres`
                            : 'Conversation directe'}
                        </p>
                      </div>

                      {/* Selection Indicator */}
                      {selectedConversation === conversation.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center"
                        >
                          <svg
                            className="w-4 h-4 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation disponible'}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-3">
              {/* Delete Button */}
              {onDelete && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDelete}
                  disabled={deleting || forwarding || loading}
                  className="w-full px-4 py-3 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <motion.svg
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </motion.svg>
                      Suppression...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer le message
                    </>
                  )}
                </motion.button>
              )}

              {/* Forward and Cancel Buttons */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </motion.button>

                <motion.button
                  whileHover={{ scale: selectedConversation ? 1.05 : 1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleForward}
                  disabled={!selectedConversation || forwarding || loading}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-all duration-200 ${
                    selectedConversation && !forwarding && !loading
                      ? 'bg-gradient-to-r from-primary to-primary-dark text-white hover:shadow-lg cursor-pointer'
                      : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {forwarding || loading ? (
                    <>
                      <motion.svg
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </motion.svg>
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Transférer
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ForwardMessageModal;
