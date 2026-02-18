'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, MessageCircle, Plus, Loader, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ConversationListSkeleton } from './SkeletonLoader';

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
  messages?: any[];
  type: 'direct' | 'group';
  members?: Array<{ id: string; name: string; avatar?: string }>;
}

interface ConversationsListProps {
  selectedId?: string;
  onSelectConversation: (conversation: Conversation) => void;
}

export const ConversationsList: React.FC<ConversationsListProps> = ({
  selectedId,
  onSelectConversation,
}) => {
const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/messages/conversations');
        if (!response.ok) throw new Error('Failed to fetch conversations');
        const data = await response.json();
        
        // Don't format timestamps here - format them on render
        // This ensures they stay in sync with message timestamps
        setConversations(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setSearchingUsers(true);
    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      }
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setSearchingUsers(false);
    }
  };

  const handleStartConversation = (user: any) => {
    // Create or switch to conversation with this user
    const conversation: Conversation = {
      id: user.id,
      name: user.name,
      avatar: user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`,
      email: user.email,
      type: 'direct',
      messages: [],
      unreadCount: 0,
      lastMessage: '',
    };

    onSelectConversation(conversation);
    setShowNewMessageModal(false);
    setUserSearch('');
    setSearchResults([]);
  };

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-primary-dark border-r border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Messages</h2>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewMessageModal(true)}
            className="p-2 hover:bg-accent hover:bg-opacity-10 rounded-full transition text-accent"
            title="Nouvelle conversation"
          >
            <Plus className="w-5 h-5" />
          </motion.button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full outline-none focus:ring-2 focus:ring-accent text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="px-2 pt-2 space-y-2">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0.6 }}
                animate={{ opacity: [0.6, 0.8, 0.6] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                className="px-4 py-3 flex items-center gap-3 border-l-4 border-transparent"
              >
                {/* Avatar Skeleton */}
                <div className="w-14 h-14 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />

                {/* Text Skeleton */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                </div>

                {/* Time Skeleton */}
                <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded ml-2 flex-shrink-0" />
              </motion.div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full text-red-500 dark:text-red-400 p-4">
            <AlertCircle className="w-12 h-12 mb-3" />
            <p className="text-sm text-center">{error}</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
            <MessageCircle className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">{searchQuery ? 'Aucune conversation trouvée' : 'Aucune conversation'}</p>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05,
                },
              },
            }}
          >
            {filteredConversations.map((conversation, index) => (
              <motion.button
                key={conversation.id}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  visible: { opacity: 1, x: 0 },
                }}
                onClick={() => onSelectConversation(conversation)}
                className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition border-l-4 ${
                  selectedId === conversation.id
                    ? 'bg-blue-50 dark:bg-gray-800 border-l-accent'
                    : 'border-l-transparent'
                }`}
              >
                {/* Avatar with Online Status */}
                <div className="relative flex-shrink-0">
                  <motion.img
                    whileHover={{ scale: 1.05 }}
                    src={conversation.avatar}
                    alt={conversation.name}
                    className="w-14 h-14 rounded-full object-cover ring-2 ring-gray-100 dark:ring-gray-700"
                  />
                  {conversation.isOnline && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white dark:border-primary-dark shadow-md"
                    ></motion.div>
                  )}
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">
                      {conversation.name}
                    </p>
                    {conversation.lastMessageTime && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
                        {formatDistanceToNow(new Date(conversation.lastMessageTime), { addSuffix: false, locale: fr })}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate flex-1">
                      {conversation.lastMessage ? conversation.lastMessage.substring(0, 40) : 'Aucun message'}
                      {conversation.lastMessage && conversation.lastMessage.length > 40 ? '...' : ''}
                    </p>
                    {conversation.unreadCount !== undefined && conversation.unreadCount > 0 && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex-shrink-0 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
                      >
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowNewMessageModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Nouvelle conversation</h3>
              <button
                onClick={() => {
                  setShowNewMessageModal(false);
                  setUserSearch('');
                  setSearchResults([]);
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  handleSearchUsers(e.target.value);
                }}
                className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-accent text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                autoFocus
              />
            </div>

            {/* Search Results */}
            <div className="max-h-96 overflow-y-auto">
              {searchingUsers ? (
                <div className="flex items-center justify-center py-8">
                  <Loader className="w-5 h-5 animate-spin text-accent" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {userSearch ? 'Aucun utilisateur trouvé' : 'Tapez pour rechercher'}
                </div>
              ) : (
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.05 },
                    },
                  }}
                >
                  {searchResults.map((user) => (
                    <motion.button
                      key={user.id}
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        visible: { opacity: 1, x: 0 },
                      }}
                      onClick={() => handleStartConversation(user)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                    >
                      <img
                        src={user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 text-left">
                        <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}    </div>
  );
};