'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Download, Heart, MessageCircle, Share2, Copy, Flag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DeleteMessageModal } from './DeleteMessageModal';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content?: string;
  image?: string;
  file?: {
    name: string;
    size: number;
    url: string;
  };
  timestamp: Date;
  reactions?: Array<{ emoji: string; count: number; users?: string[] }>;
  isRead: boolean;
  deletedAt?: Date;
}

interface MessageBubbleProps {
  message: Message;
  isMine: boolean;
  onReaction?: (messageId: string, emoji: string) => void;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (messageId: string, newContent: string) => void;
  onForward?: (message: Message) => void;
  onCopy?: (content: string | undefined) => void;
}

const reactionEmojis = ['❤️', '👍', '😂', '😍', '😮', '😢', '🔥', '👎'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isMine,
  onReaction,
  onReply,
  onDelete,
  onEdit,
  onForward,
  onCopy,
}) => {
  const [showActions, setShowActions] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content || '');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content);
      onCopy?.(message.content);
      setCopiedId(message.id);
      // Close menu after copy
      setTimeout(() => {
        setShowMenu(false);
        setShowActions(false);
      }, 200);
      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleEdit = () => {
    if (editedContent.trim() && editedContent.trim() !== message.content) {
      onEdit?.(message.id, editedContent.trim());
      setIsEditing(false);
    } else {
      setIsEditing(false);
    }
  };

  const handleDeleteMessage = async (scope: 'me' | 'everyone') => {
    try {
      const response = await fetch(`/api/messages/${message.id}?scope=${scope}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to delete message');
      }

      // Always call onDelete to remove from UI immediately
      // For 'me' scope, the message is hidden but remains visible to others
      // For 'everyone' scope, the message is marked deleted for everyone
      onDelete?.(message.id);

      // Close the modal
      setDeleteModalOpen(false);
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Erreur lors de la suppression du message');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`flex ${isMine ? 'justify-end' : 'justify-start'} mb-2`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowReactions(false);
        setShowMenu(false);
      }}
    >
      <div className={`flex ${isMine ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-xs`}>
        {/* Avatar */}
        {!isMine ? (
          // Messages reçus: afficher l'avatar du sender
          <img
            src={message.senderAvatar}
            alt={message.senderName}
            title={message.senderName}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 mb-1 hover:ring-2 hover:ring-primary transition-all"
          />
        ) : (
          // Messages envoyés: avatar du current user (optionnel)
          <div className="w-8 h-8 flex-shrink-0 mb-1" title="Vous" />
        )}

        {/* Message Content */}
        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} gap-1`}>
          {/* Sender name display */}
          {isMine ? (
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-3 opacity-70">
              Vous
            </p>
          ) : (
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 px-3 opacity-70">
              {message.senderName}
            </p>
          )}

          {/* Message Bubble */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`group relative ${
              isMine
                ? 'bg-gradient-to-r from-primary-dark to-blue-700 text-white rounded-3xl rounded-br-none'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-3xl rounded-bl-none'
            } px-4 py-2.5 shadow-md hover:shadow-lg transition-shadow`}
          >
            {/* Text Content */}
            {message.content && !isEditing && (
              <p className="break-words text-sm leading-5 whitespace-pre-wrap">
                {message.content}
              </p>
            )}

            {/* Edit Mode */}
            {isEditing && (
              <div className="space-y-2">
                <textarea
                  placeholder="Edit message"
                  value={editedContent}
                  onChange={(e) => setEditedContent(e.target.value)}
                  className={`w-full rounded border-2 p-2 text-sm font-normal outline-none resize-none ${
                    isMine
                      ? 'bg-blue-600/30 border-blue-400 text-white'
                      : 'bg-gray-300/30 border-gray-400 text-gray-900 dark:text-white'
                  }`}
                  rows={3}
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setEditedContent(message.content || '');
                      setIsEditing(false);
                    }}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      isMine
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-gray-400/30 hover:bg-gray-500/40 text-gray-900 dark:text-white'
                    }`}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleEdit}
                    disabled={!editedContent.trim() || editedContent.trim() === message.content}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                      isMine
                        ? 'bg-green-500/50 hover:bg-green-600/50 text-white disabled:opacity-50'
                        : 'bg-green-400/50 hover:bg-green-500/50 text-gray-900 dark:text-white disabled:opacity-50'
                    }`}
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            )}

            {/* Image */}
            {message.image && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="mt-2 -mx-4 -mb-2.5"
              >
                <img
                  src={message.image}
                  alt="shared image"
                  className="rounded-2xl max-w-sm max-h-96 object-cover"
                />
              </motion.div>
            )}

            {/* File */}
            {message.file && (
              <motion.a
                whileHover={{ scale: 1.02 }}
                href={message.file.url}
                download
                className={`mt-2 flex items-center gap-2 p-2.5 rounded-lg transition-colors ${
                  isMine
                    ? 'bg-white/20 hover:bg-white/30'
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3v-6" />
                </svg>
                <div className="text-xs font-medium truncate">
                  {message.file.name}
                </div>
              </motion.a>
            )}

            {/* Timestamp & Read Indicator - Always visible */}
            <div className={`text-xs mt-1.5 flex items-center gap-1.5 ${isMine ? 'text-white/70 justify-end' : 'text-gray-500 dark:text-gray-400 justify-start'}`}>
              <span>
                {formatDistanceToNow(new Date(message.timestamp), {
                  addSuffix: false,
                  locale: fr,
                })}
              </span>
              {isMine && (
                <span className={`text-xs font-semibold ${message.isRead ? 'text-blue-300' : 'text-white/60'}`}>
                  {message.isRead ? '✓✓' : '✓'}
                </span>
              )}
            </div>

            {/* Action Buttons - Hover */}
            <AnimatePresence>
              {showActions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, y: 10 }}
                  className="absolute -top-12 right-0 flex gap-2 bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-3 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm"
                >
                  {/* Reaction Button */}
                  <motion.button
                    whileHover={{ scale: 1.2, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowReactions(!showReactions)}
                    className="p-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded-lg transition-all duration-200"
                    title="Réagir"
                  >
                    <span className="text-xl">😊</span>
                  </motion.button>

                  {/* Reply Button */}
                  {onReply && (
                    <motion.button
                      whileHover={{ scale: 1.2, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onReply(message);
                        setShowActions(false);
                      }}
                      className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200 text-blue-600 dark:text-blue-400"
                      title="Répondre"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </motion.button>
                  )}

                  {/* Forward Button */}
                  {onForward && (
                    <motion.button
                      whileHover={{ scale: 1.2, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        onForward(message);
                        setShowActions(false);
                      }}
                      className="p-2 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-all duration-200 text-green-600 dark:text-green-400"
                      title="Transférer"
                    >
                      <Share2 className="w-5 h-5" />
                    </motion.button>
                  )}

                  {/* More Menu */}
                  <div className="relative">
                    <motion.button
                      whileHover={{ scale: 1.2, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 text-gray-600 dark:text-gray-400"
                      title="Plus d'options"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="6" cy="12" r="1.5" />
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="18" cy="12" r="1.5" />
                      </svg>
                    </motion.button>

                    {/* Dropdown Menu */}
                    <AnimatePresence>
                      {showMenu && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.8, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.8, y: -10 }}
                          className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50"
                        >
                          {/* Copy Button */}
                          {message.content && (
                            <motion.button
                              whileHover={{ backgroundColor: 'var(--hover-bg)' }}
                              onClick={handleCopy}
                              className="w-full px-4 py-3 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-900 dark:text-gray-100 transition-colors flex items-center gap-3 font-medium"
                              title="Copier le message"
                            >
                              <Copy className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span>{copiedId === message.id ? '✓ Copié!' : 'Copier le message'}</span>
                            </motion.button>
                          )}

                          {isMine && message.content && (
                            <>
                              <div className="border-t border-gray-200 dark:border-gray-700" />
                              <motion.button
                                whileHover={{ backgroundColor: 'var(--hover-bg)' }}
                                onClick={() => {
                                  setIsEditing(true);
                                  setShowMenu(false);
                                  setShowActions(false);
                                }}
                                className="w-full px-4 py-3 text-sm text-left hover:bg-yellow-50 dark:hover:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 transition-colors flex items-center gap-3 font-medium"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M3 17.25V21h3.75L17.81 9.94m-5.67 5.67L3 21m15-18l-2.25 2.25m0 0l2.25 2.25" />
                                </svg>
                                Éditer
                              </motion.button>
                            </>
                          )}

                          {isMine && onDelete && (
                            <>
                              <div className="border-t border-gray-200 dark:border-gray-700" />
                              <motion.button
                                whileHover={{ backgroundColor: 'var(--hover-bg)' }}
                                onClick={() => {
                                  setDeleteModalOpen(true);
                                  setShowMenu(false);
                                  setShowActions(false);
                                }}
                                className="w-full px-4 py-3 text-sm text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors flex items-center gap-3 font-medium"
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer le message
                              </motion.button>
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Reaction Picker */}
            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.6, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.6, y: 15 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 300 }}
                  className="absolute -bottom-14 left-0 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 p-2 flex gap-1.5 backdrop-blur-sm"
                >
                  {reactionEmojis.map((emoji, idx) => (
                    <motion.button
                      key={emoji}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      whileHover={{ scale: 1.3, y: -4, rotate: 10 }}
                      whileTap={{ scale: 0.85 }}
                      onClick={() => {
                        onReaction?.(message.id, emoji);
                        setShowReactions(false);
                      }}
                      className="text-2xl hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg p-2 transition-all duration-200 cursor-pointer"
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Reactions Display - Emoji Cards */}
          {message.reactions && message.reactions.length > 0 && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`flex gap-2 mt-3 ${isMine ? 'justify-end' : 'justify-start'} flex-wrap max-w-xs`}
            >
              {message.reactions.map((reaction, idx) => (
                <motion.div
                  key={`${idx}-${reaction.emoji}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: idx * 0.08, type: 'spring', stiffness: 300, damping: 20 }}
                  whileHover={{ scale: 1.2, y: -3 }}
                  whileTap={{ scale: 0.9 }}
                  className="bg-yellow-100 dark:bg-yellow-900/40 rounded-full px-2.5 py-1 shadow-sm hover:shadow-md border border-yellow-300 dark:border-yellow-700 inline-flex items-center gap-1 cursor-pointer transition-all duration-200"
                >
                  <motion.span 
                    className="text-base leading-none" 
                    whileHover={{ scale: 1.25, rotate: 15 }}
                  >
                    {reaction.emoji}
                  </motion.span>
                  {reaction.count > 1 && (
                    <motion.span 
                      className="text-xs font-bold text-yellow-700 dark:text-yellow-300 leading-none"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: idx * 0.08 + 0.1 }}
                    >
                      {reaction.count}
                    </motion.span>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Delete Message Modal */}
      <DeleteMessageModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onDelete={handleDeleteMessage}
      />
    </motion.div>
  );
};
