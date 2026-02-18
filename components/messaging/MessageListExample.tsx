'use client';

import React, { useState } from 'react';
import { MessageBubble } from './MessageBubble';
import { ForwardMessageModal } from './ForwardMessageModal';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content?: string;
  image?: string;
  timestamp: Date;
  reactions?: Array<{ emoji: string; count: number; users?: string[] }>;
  isRead: boolean;
}

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  type: 'direct' | 'group';
  members?: Array<{ id: string; name: string; avatar?: string }>;
}

interface MessageListExampleProps {
  currentUserId: string;
  conversations: Conversation[];
}

export const MessageListExample: React.FC<MessageListExampleProps> = ({
  currentUserId,
  conversations,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      senderId: 'user123',
      senderName: 'Jean',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jean',
      content: 'Salut! Comment ça va? 👋',
      timestamp: new Date(Date.now() - 5 * 60000),
      reactions: [{ emoji: '👍', count: 1 }, { emoji: '😊', count: 1 }],
      isRead: true,
    },
    {
      id: '2',
      senderId: currentUserId,
      senderName: 'Moi',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Me',
      content: 'Ça va bien! J\'ai des nouvelles excitantes à partager 🎉',
      timestamp: new Date(Date.now() - 3 * 60000),
      reactions: [{ emoji: '❤️', count: 2 }],
      isRead: true,
    },
    {
      id: '3',
      senderId: 'user456',
      senderName: 'Marie',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marie',
      content: 'C\'est vrai? Raconte-moi tout!',
      timestamp: new Date(Date.now() - 1 * 60000),
      reactions: [],
      isRead: true,
    },
  ]);

  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedMessageForForward, setSelectedMessageForForward] = useState<Message | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  const handleReaction = (messageId: string, emoji: string) => {
    setMessages(messages.map(msg => {
      if (msg.id === messageId) {
        const existingReaction = msg.reactions?.find(r => r.emoji === emoji);
        if (existingReaction) {
          existingReaction.count += 1;
        } else {
          if (!msg.reactions) msg.reactions = [];
          msg.reactions.push({ emoji, count: 1 });
        }
      }
      return msg;
    }));

    showNotification(`Réaction ${emoji} ajoutée!`, 'success');
  };

  const handleReply = (message: Message) => {
    showNotification(`Répondre à: "${message.content?.substring(0, 30)}..."`, 'info');
  };

  const handleDelete = (messageId: string) => {
    setMessages(messages.filter(msg => msg.id !== messageId));
    showNotification('Message supprimé', 'success');
  };

  const handleForward = (message: Message) => {
    setSelectedMessageForForward(message);
    setShowForwardModal(true);
  };

  const handleForwardToConversation = async (conversationId: string, message: Message): Promise<void> => {
    return new Promise(resolve => {
      setTimeout(() => {
        showNotification(`Message transféré à ${conversations.find(c => c.id === conversationId)?.name}`, 'success');
        resolve();
      }, 1000);
    });
  };

  const handleCopy = (content: string | undefined) => {
    if (content) {
      showNotification('Message copié dans le presse-papiers', 'success');
    }
  };

  const showNotification = (message: string, type: 'success' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Messages List */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4 max-w-2xl mx-auto"
      >
        {messages.map((message) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            layout
          >
            <MessageBubble
              message={message}
              isMine={message.senderId === currentUserId}
              onReaction={handleReaction}
              onReply={handleReply}
              onDelete={handleDelete}
              onForward={handleForward}
              onCopy={handleCopy}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Forward Modal */}
      {selectedMessageForForward && (
        <ForwardMessageModal
          isOpen={showForwardModal}
          message={selectedMessageForForward}
          conversations={conversations}
          onClose={() => {
            setShowForwardModal(false);
            setSelectedMessageForForward(null);
          }}
          onForward={handleForwardToConversation}
        />
      )}

      {/* Notification */}
      {notification && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-6 left-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 flex items-center gap-3 border border-green-200 dark:border-green-900"
        >
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
          <p className="text-gray-900 dark:text-white">{notification.message}</p>
        </motion.div>
      )}

      {/* Feature Documentation */}
      <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          ✨ Nouvelles Fonctionnalités
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2">😊 Cartes Emojis Améliorées</h4>
            <p className="text-sm text-blue-800 dark:text-blue-400">
              Les réactions sont maintenant affichées comme des cartes stylisées avec gradients et animations fluides.
            </p>
          </div>

          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <h4 className="font-semibold text-green-900 dark:text-green-300 mb-2">➡️ Transférer les Messages</h4>
            <p className="text-sm text-green-800 dark:text-green-400">
              Cliquez sur le bouton de partage pour transférer un message vers une autre conversation.
            </p>
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-2">💬 Répondre Facilement</h4>
            <p className="text-sm text-purple-800 dark:text-purple-400">
              Appuyez sur l'icône de réponse pour citer un message spécifique dans la conversation.
            </p>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
            <h4 className="font-semibold text-red-900 dark:text-red-300 mb-2">🗑️ Supprimer les Messages</h4>
            <p className="text-sm text-red-800 dark:text-red-400">
              Supprimez vos propres messages en cliquant sur le menu (trois points) et sélectionnez "Supprimer".
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageListExample;
