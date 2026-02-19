'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageInput } from './MessageInput';
import { MessageBubble } from './MessageBubble';
import { ForwardMessageModal } from './ForwardMessageModal';
import { MessageRequestBubble } from './MessageRequestBubble';
import { MessageRequestModal } from './MessageRequestModal';
import { 
  Send, 
  Paperclip, 
  Smile, 
  MoreVertical,
  ChevronDown,
  Search,
  X,
  User,
  Info,
  Ban
} from 'lucide-react';

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
  reactions?: Array<{ emoji: string; count: number }>;
  isRead: boolean;
  isMessageRequest?: boolean;
  messageRequestStatus?: 'pending' | 'accepted' | 'rejected';
  sender?: {
    id: string;
    username: string;
    fullName: string;
    avatar?: string;
  };
}

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  type: 'direct' | 'group';
  members?: Array<{ id: string; name: string; avatar?: string }>;
}

// VideoCall type removed (feature deleted)

interface MessagesContainerProps {
  conversationId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserAvatar: string;
  recipientId?: string;
  recipientName: string;
  recipientAvatar: string;
  onSendMessage?: (message: Omit<Message, 'id' | 'timestamp' | 'isRead'>) => void;
  messages?: Message[];
  conversations?: Conversation[];
}

export const MessagesContainer: React.FC<MessagesContainerProps> = ({
  conversationId,
  currentUserId,
  currentUserName,
  currentUserAvatar,
  recipientId,
  recipientName,
  recipientAvatar,
  onSendMessage,
  messages: initialMessages = [],
  conversations = [],
}) => {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [messageRequest, setMessageRequest] = useState<any>(null);
  const [showMessageRequestModal, setShowMessageRequestModal] = useState(false);
  const [messageRequestLoading, setMessageRequestLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [selectedMessageForForward, setSelectedMessageForForward] = useState<Message | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingPollingRef = useRef<NodeJS.Timeout | null>(null);

  // Call feature removed: related state omitted

  // Call polling removed

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    const markMessagesAsRead = async () => {
      try {
        // Get all unread messages received by current user
        const unreadMessages = messages.filter(msg => !msg.isRead && msg.senderId !== currentUserId);
        
        if (unreadMessages.length > 0) {
          const response = await fetch('/api/messages/mark-conversation-read', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ userId: recipientId }),
          });

          if (response.ok) {
            // Update local state
            setMessages(prev => prev.map(msg => 
              msg.senderId !== currentUserId ? { ...msg, isRead: true } : msg
            ));
          }
        }
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    };

    // Mark messages as read when conversation is viewed
    if (messages.length > 0 && recipientId) {
      const unreadCount = messages.filter(msg => !msg.isRead && msg.senderId !== currentUserId).length;
      if (unreadCount > 0) {
        markMessagesAsRead();
      }
    }
  }, [messages.length, recipientId, currentUserId]);

  // Polling for typing indicator
  useEffect(() => {
    if (!recipientId) return;

    const pollTypingStatus = async () => {
      try {
        const response = await fetch(`/api/messages/typing?partnerId=${recipientId}`);
        if (response.ok) {
          const data = await response.json();
          setIsPartnerTyping(data.isPartnerTyping || false);
        }
      } catch (error) {
        console.error('Error polling typing status:', error);
      }
    };

    // Initial poll
    pollTypingStatus();

    // Set up polling interval (check every 2 seconds instead of 500ms to reduce load)
    typingPollingRef.current = setInterval(pollTypingStatus, 2000);

    return () => {
      if (typingPollingRef.current) {
        clearInterval(typingPollingRef.current);
      }
    };
  }, [recipientId]);

  // Handle typing notification
  const notifyTyping = async (isTyping: boolean = true) => {
    if (!recipientId) return;

    try {
      await fetch('/api/messages/typing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          conversationPartnerId: recipientId,
          isTyping,
        }),
      });
    } catch (error) {
      console.error('Error sending typing indicator:', error);
    }
  };

  // Handle typing with debounce
  const handleUserTyping = (isTyping: boolean) => {
    if (isTyping) {
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Send typing indicator
      notifyTyping(true);
      
      // Set timeout to stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        notifyTyping(false);
      }, 3000);
    } else {
      // User stopped typing
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      notifyTyping(false);
    }
  };

  // Polling pour mise à jour en temps réel des messages
  useEffect(() => {
    if (!recipientId) return;

    const pollMessages = async () => {
      try {
        const response = await fetch(`/api/messages/conversations/${recipientId}`);
        if (response.ok) {
          const data = await response.json();
          // Separate message requests from regular messages
          const allMessages: any[] = Array.isArray(data) ? data : [];
          
          // Find pending message request (only show to receiver, not sender)
          const pendingMessageReq = allMessages.find((msg: any) => 
            msg.isMessageRequest && msg.messageRequestStatus === 'pending' && msg.receiverId === currentUserId
          );

          if (pendingMessageReq) {
            setMessageRequest(pendingMessageReq);
            // Open modal for recipient by default
            setShowMessageRequestModal(true);
          } else {
            // Clear message request if no pending one exists
            setMessageRequest(null);
          }
          
          // Merge optimistic messages with server messages
          // Keep optimistic messages (with temp IDs like msg_*) and replace with server versions when they arrive
          setMessages(prevMessages => {
            // Separate optimistic messages (temporary IDs) from real messages
            const optimisticMsgs = prevMessages.filter(msg => msg.id.startsWith('msg_'));
            const serverMsgs = allMessages;
            
            // Build a set of server message IDs
            const serverIds = new Set(serverMsgs.map(m => m.id));
            
            // Keep optimistic messages that don't have a server counterpart yet
            const remainingOptimistic = optimisticMsgs.filter(msg => {
              // Check if this optimistic message has been saved to server
              // (by checking if its content exists in server messages)
              const foundInServer = serverMsgs.some(
                sm => sm.content === msg.content && sm.senderId === msg.senderId
              );
              return !foundInServer;
            });
            
            // Combine: server messages + any remaining optimistic messages
            return [...serverMsgs, ...remainingOptimistic];
          });
        }
      } catch (error) {
        console.error('Erreur lors du polling des messages:', error);
      }
    };

    // Faire un polling initial
    pollMessages();

    // Configurer le polling automatique (1.5 seconde pour une meilleure réactivité)
    pollingRef.current = setInterval(pollMessages, 1500);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [recipientId]);

  // Call handlers removed

  const handleSendMessage = (content: string, attachments?: { type: 'image' | 'file'; data: string; name?: string }[]) => {
    if (!content.trim() && !attachments?.length) return;

    const newMessage: Message = {
      id: `msg_${Date.now()}`,
      senderId: currentUserId,
      senderName: currentUserName,
      senderAvatar: currentUserAvatar,
      content: content || undefined,
      image: attachments?.find(a => a.type === 'image')?.data,
      file: attachments?.find(a => a.type === 'file') ? {
        name: attachments.find(a => a.type === 'file')?.name || 'file',
        size: 0,
        url: attachments.find(a => a.type === 'file')?.data || '',
      } : undefined,
      timestamp: new Date(),
      isRead: false,
      reactions: [],
    };

    setMessages([...messages, newMessage]);
    onSendMessage?.(newMessage);
  };

  const handleForward = (message: Message) => {
    setSelectedMessageForForward(message);
    setShowForwardModal(true);
  };

  const handleForwardToConversation = async (conversationId: string, message: Message): Promise<void> => {
    try {
      const response = await fetch(`/api/messages/${conversationId}/forward`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalMessageId: message.id,
          content: message.content,
          image: message.image,
        }),
      });

      if (!response.ok) throw new Error('Failed to forward message');
      
      // Fermer le modal
      setShowForwardModal(false);
      setSelectedMessageForForward(null);
    } catch (error) {
      console.error('Error forwarding message:', error);
      // Don't re-throw - let modal handle the error display
    }
  };

  const handleDelete = async (messageId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete message');
      
      // Supprimer le message de la liste
      setMessages(messages.filter(msg => msg.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleCopy = (content: string | undefined) => {
    if (content) {
      navigator.clipboard.writeText(content);
      console.log('Message copié:', content);
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });

      if (!response.ok) throw new Error('Failed to add reaction');
      
      const updatedReactions = await response.json();
      setMessages(messages.map(msg =>
        msg.id === messageId
          ? { ...msg, reactions: updatedReactions }
          : msg
      ));
    } catch (err) {
      console.error('Error adding reaction:', err);
      // Optimistic update fallback
      setMessages(messages.map(msg => 
        msg.id === messageId
          ? {
              ...msg,
              reactions: msg.reactions?.some(r => r.emoji === emoji)
                ? msg.reactions.map(r => 
                    r.emoji === emoji 
                      ? { ...r, count: Math.max(1, r.count - 1) }
                      : r
                  ).filter(r => r.count > 0)
                : [...(msg.reactions || []), { emoji, count: 1 }]
            }
          : msg
      ));
    }
  };

  const handleEdit = async (messageId: string, newContent: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });

      if (!response.ok) throw new Error('Failed to edit message');
      
      // Mettre à jour le message localement
      setMessages(messages.map(msg =>
        msg.id === messageId
          ? { ...msg, content: newContent }
          : msg
      ));
    } catch (error) {
      console.error('Error editing message:', error);
    }
  };

  const handleViewProfile = () => {
    // Navigate to user profile
    if (recipientId) {
      router.push(`/users/${recipientId}/profile`);
    }
    setHeaderMenuOpen(false);
  };

  const handleConversationInfo = () => {
    // Show conversation details in an alert or modal
    const infoMessage = `Conversation avec ${recipientName}\n\nID: ${recipientId}\n\nOptions:\n- Voir Profile\n- Bloquer l'utilisateur\n- Chercher dans les messages`;
    alert(infoMessage);
    setHeaderMenuOpen(false);
  };

  const handleBlockUser = async () => {
    if (!recipientId) return;
    
    const confirmBlock = confirm(`Êtes-vous sûr de vouloir bloquer ${recipientName}?\n\nVous ne pourrez plus voir ses messages et il ne pourra pas vous contacter.`);
    if (!confirmBlock) return;
    
    try {
      const response = await fetch(`/api/users/${recipientId}/block`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to block user');
      
      // Show success message and navigate back
      alert(`${recipientName} a été bloqué avec succès`);
      router.push('/messages');
    } catch (error) {
      console.error('Error blocking user:', error);
      alert('Erreur lors du blocage de l\'utilisateur. Veuillez réessayer.');
    } finally {
      setHeaderMenuOpen(false);
    }
  };

  // Filter messages based on search query and exclude all message requests
  const filteredMessages = messages.filter(msg => {
    // Exclude ALL message requests from normal message display (they're shown in MessageRequestBubble)
    if (msg.isMessageRequest) {
      return false;
    }
    
    // Apply search filter
    if (!searchQuery.trim()) return true;
    return msg.content?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
  });

  const handleAcceptMessageRequest = async (messageId: string) => {
    try {
      setMessageRequestLoading(true);
      const response = await fetch('/api/messages/message-request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messageId, action: 'accept' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept message request');
      }

      const data = await response.json();
      
      // Clear message request - polling will refresh messages automatically
      setMessageRequest(null);
      setShowMessageRequestModal(false);
      
      return data;
    } catch (error) {
      console.error('Error accepting message request:', error);
      throw error;
    } finally {
      setMessageRequestLoading(false);
    }
  };

  const handleRejectMessageRequest = async (messageId: string) => {
    try {
      setMessageRequestLoading(true);
      const response = await fetch('/api/messages/message-request', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ messageId, action: 'reject' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject message request');
      }

      const data = await response.json();
      
      setMessageRequest(null);
      setShowMessageRequestModal(false);
      
      // Navigate back to messages
      router.push('/messages');
      
      return data;
    } catch (error) {
      console.error('Error rejecting message request:', error);
      throw error;
    } finally {
      setMessageRequestLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <motion.div
        initial={{ y: 0 }}
        animate={{ y: showHeader ? 0 : -100 }}
        className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm"
      >
        {/* Search Bar */}
        <AnimatePresence>
          {showSearchBar && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-4 py-3 border-b border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <input
                  type="text"
                  placeholder="Chercher dans les messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  autoFocus
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowSearchBar(false);
                    setSearchQuery('');
                  }}
                  className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-4 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" 
            onClick={handleViewProfile}
          >
            <div className="relative">
              <img
                src={recipientAvatar}
                alt={recipientName}
                className="w-10 h-10 rounded-full object-cover ring-2 ring-primary-dark/20"
              />
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white"></div>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{recipientName}</h3>
              <p className="text-xs text-green-500 font-medium">Actif maintenant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowSearchBar(!showSearchBar)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title="Chercher dans les messages"
            >
              <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </motion.button>
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setHeaderMenuOpen(!headerMenuOpen)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </motion.button>

              <AnimatePresence>
                {headerMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden z-50"
                  >
                    <button 
                      onClick={handleViewProfile}
                      className="w-full px-4 py-3 text-sm text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors text-gray-900 dark:text-white font-medium flex items-center gap-3"
                    >
                      <User size={18} className="text-blue-600 dark:text-blue-400" />
                      <span>Voir le profil</span>
                    </button>
                    <button 
                      onClick={handleConversationInfo}
                      className="w-full px-4 py-3 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-white font-medium flex items-center gap-3 border-t border-gray-200 dark:border-gray-600"
                    >
                      <Info size={18} className="text-gray-600 dark:text-gray-400" />
                      <span>Infos conversation</span>
                    </button>
                    <button 
                      onClick={handleBlockUser}
                      className="w-full px-4 py-3 text-sm text-left hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400 font-medium flex items-center gap-3 border-t border-gray-200 dark:border-gray-600"
                    >
                      <Ban size={18} />
                      <span>Bloquer cet utilisateur</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3 scroll-smooth"
        onWheel={() => setShowHeader(true)}
      >
        <AnimatePresence mode="popLayout">
          {filteredMessages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full flex flex-col items-center justify-center text-gray-500"
            >
              {searchQuery ? (
                <>
                  <div className="text-5xl mb-4">🔍</div>
                  <p className="text-lg font-medium">Aucun message trouvé</p>
                  <p className="text-sm mt-1">Essayez une autre recherche</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-4">💬</div>
                  <p className="text-lg font-medium">Aucun message</p>
                  <p className="text-sm mt-1">Commencez une conversation!</p>
                </>
              )}
            </motion.div>
          ) : (
            <>
              {/* Display message request if it exists */}
              {messageRequest && (
                <>
                  <MessageRequestBubble
                    request={messageRequest}
                    isLoading={messageRequestLoading}
                    onAccept={async (messageId: string) => handleAcceptMessageRequest(messageId)}
                    onReject={async (messageId: string) => handleRejectMessageRequest(messageId)}
                  />

                  {showMessageRequestModal && (
                    <MessageRequestModal
                      request={messageRequest}
                      isOpen={showMessageRequestModal}
                      onClose={() => setShowMessageRequestModal(false)}
                      onAccept={handleAcceptMessageRequest}
                      onReject={handleRejectMessageRequest}
                    />
                  )}
                </>
              )}
              
              {/* Display regular messages */}
              {filteredMessages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isMine={message.senderId === currentUserId}
                  onReaction={handleReaction}
                  onReply={handleReply}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onForward={handleForward}
                  onCopy={handleCopy}
                />
              ))}
            </>
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Typing Indicator */}
      <AnimatePresence>
        {isPartnerTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-4 py-2"
          >
            <div className="flex items-center gap-2">
              <img
                src={recipientAvatar}
                alt={recipientName}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-700 px-3 py-2 rounded-full">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message Input */}
{/* Message Input with Reply UI */}
      <MessageInput 
        onSendMessage={handleSendMessage}
        onTyping={handleUserTyping}
        currentUserAvatar={currentUserAvatar}
        replyingTo={replyingTo}
        onCancelReply={handleCancelReply}
      />

      {/* Forward Message Modal */}
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
          onDelete={handleDelete}
        />
      )}

      {/* Call UI removed */}
    </div>
  );
};

