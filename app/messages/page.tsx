'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UI_CONFIG } from '@/lib/search-actions-config';
import Link from 'next/link';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { FriendsMessageList } from '@/components/FriendsMessageList';
import { motion } from 'framer-motion';
import { MessageCircle, MoreVertical, Send, Heart, Paperclip, Download } from 'lucide-react';
import { HeartIcon } from '@/components/HeartIcon';

interface Conversation {
  id: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  lastMessage: string;
  time: string;
  unread: number;
}

export default function MessagesPage() {
  const { translation } = useLanguage();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState<{ type: 'image'|'document'; dataUrl: string | null } | null>(null);
  const [messages, setMessages] = useState<Array<any>>([]);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [originalMessages, setOriginalMessages] = useState<Array<any> | null>(null);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type?: 'success'|'error' } | null>(null);
  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!selectedConversation) return;

    const fetchConversation = async () => {
      try {
        const url = typeof window !== 'undefined' 
          ? `${window.location.origin}/api/messages?userId=${selectedConversation}`
          : `/api/messages?userId=${selectedConversation}`;
          
        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (!res.ok) throw new Error('Failed to load conversation');
        const data = await res.json();
        
        // data is an array of messages
        const mapped = data.map((m: any) => ({
          id: m.id,
          content: m.content,
          time: m.createdAt,
          isMine: m.sender?.id === selectedConversation ? false : true, // If sender is the other person, it's not mine
          sender: m.sender,
          receiver: m.receiver,
          reactions: m.reactions || [],
          image: m.image || null,
          document: m.document || null,
        }));
        setMessages(mapped);
        
        // Set selected user from the other person in conversation
        if (mapped.length > 0) {
          // The selectedUser should be the person we're talking to (not current user)
          const firstMsg = mapped[0];
          const otherUser = firstMsg.isMine ? firstMsg.receiver : firstMsg.sender;
          if (otherUser && otherUser.id === selectedConversation) {
            setSelectedUser(otherUser);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchConversation();
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) {
      setSendError('Message and recipient required');
      return;
    }

    // Clear typing indicator before sending
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    setIsSending(true);
    setSendError(null);

    try {
      const url = typeof window !== 'undefined' 
        ? `${window.location.origin}/api/messages/send`
        : '/api/messages/send';
        
      const payload: any = { receiverId: selectedConversation, content: newMessage };
      if (attachment?.dataUrl) {
        if (attachment.type === 'image') payload.image = attachment.dataUrl;
        else payload.document = attachment.dataUrl;
      }

      const res = await fetch(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Failed to send message' }));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }
      
      const sent = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: sent.id,
          content: sent.content,
          time: sent.createdAt,
          isMine: true,
          sender: sent.sender,
          reactions: sent.reactions || [],
          image: sent.image || null,
          document: sent.document || null,
        },
      ]);
      setNewMessage('');
      setAttachment(null);
      setSendError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error sending message';
      console.error('Send message error:', err);
      setSendError(errorMessage);
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = async (text: string) => {
    setNewMessage(text);

    // Clear previous timeout
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    // Send typing indicator
    if (text.trim() && selectedConversation) {
      try {
        const url = typeof window !== 'undefined'
          ? `${window.location.origin}/api/messages/typing`
          : '/api/messages/typing';
        await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationPartnerId: selectedConversation, isTyping: true }),
        }).catch(() => {});
      } catch (e) {
        console.error('Typing indicator error:', e);
      }

      // Clear typing after 3 seconds of no typing
      typingTimeoutRef.current = setTimeout(() => {
        fetch(typeof window !== 'undefined' ? `${window.location.origin}/api/messages/typing` : '/api/messages/typing', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationPartnerId: selectedConversation, isTyping: false }),
        }).catch(() => {});
      }, 3000);
    } else if (!text.trim() && selectedConversation) {
      // Clear typing immediately when input is empty
      try {
        const url = typeof window !== 'undefined'
          ? `${window.location.origin}/api/messages/typing`
          : '/api/messages/typing';
        await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationPartnerId: selectedConversation, isTyping: false }),
        }).catch(() => {});
      } catch (e) {
        console.error('Typing indicator error:', e);
      }
    }
  };

  // Poll for partner typing status
  useEffect(() => {
    if (!selectedConversation) return;

    const checkTyping = async () => {
      try {
        const url = typeof window !== 'undefined'
          ? `${window.location.origin}/api/messages/typing?partnerId=${selectedConversation}`
          : `/api/messages/typing?partnerId=${selectedConversation}`;
        const res = await fetch(url, {
          credentials: 'include',
        });
        if (res.ok) {
          const data = await res.json();
          setIsPartnerTyping(data.isPartnerTyping ?? false);
        }
      } catch (e) {
        console.error('Error checking typing status:', e);
      }
    };

    const interval = setInterval(checkTyping, 500);
    return () => clearInterval(interval);
  }, [selectedConversation]);

  // Long-press handling
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);
  const [longPressMessage, setLongPressMessage] = useState<any | null>(null);
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  const handleMessagePointerDown = (e: any, message: any) => {
    // start long-press timer
    longPressTimer.current = setTimeout(() => {
      setLongPressMessage(message);
      setMenuPos({ x: e.clientX || (e.touches && e.touches[0]?.clientX) || 100, y: e.clientY || (e.touches && e.touches[0]?.clientY) || 100 });
    }, 600);
  };

  const clearLongPressTimer = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleMessagePointerUp = (e: any, message: any) => {
    clearLongPressTimer();
  };

  const handleMessagePointerCancel = (e: any, message: any) => {
    clearLongPressTimer();
  };

  const closeLongPressMenu = () => {
    setLongPressMessage(null);
    setMenuPos(null);
  };

  const groupReactions = (reactions: any[]) => {
    const map = new Map<string, { emoji: string; count: number }>();
    reactions.forEach((r:any) => {
      const key = r.emoji;
      if (!map.has(key)) map.set(key, { emoji: key, count: 0 });
      map.get(key)!.count += 1;
    });
    return Array.from(map.values());
  };

  const deleteMessage = async (messageId: string, scope: 'me'|'everyone') => {
    try {
      const url = typeof window !== 'undefined' ? `${window.location.origin}/api/messages/${messageId}?scope=${scope}` : `/api/messages/${messageId}?scope=${scope}`;
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete');
      // remove from UI
      setMessages(prev => prev.filter(m => m.id !== messageId));
      closeLongPressMenu();
    } catch (e) {
      console.error('Delete message failed', e);
    }
  };

  const reactToMessage = async (messageId: string, emoji: string) => {
    try {
      const url = typeof window !== 'undefined' ? `${window.location.origin}/api/messages/${messageId}/reactions` : `/api/messages/${messageId}/reactions`;
      const res = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ emoji }) });
      if (!res.ok) throw new Error('Failed to react');
      const json = await res.json();
      // update local message reactions
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions: updateReactionsLocal(m.reactions || [], json) } : m));
      closeLongPressMenu();
    } catch (e) {
      console.error('React failed', e);
    }
  };

  const updateReactionsLocal = (existing: any[], resJson: any) => {
    // resJson.action: added/updated/removed, resJson.reaction
    try {
      const action = resJson.action;
      const reaction = resJson.reaction || null;
      if (action === 'removed') {
        // remove user's reaction
        return existing.filter((r:any) => r.user?.id !== (reaction?.user?.id) );
      }
      if (action === 'added' || action === 'updated') {
        // replace or add
        const copy = existing.filter((r:any) => r.user?.id !== reaction.user.id);
        copy.push(reaction);
        return copy;
      }
    } catch (e) {}
    return existing;
  };

  const handleLikeMessage = async (messageId: string) => {
    try {
      const url = typeof window !== 'undefined' ? `${window.location.origin}/api/messages/${messageId}/like` : `/api/messages/${messageId}/like`;
      const res = await fetch(url, { method: 'POST', credentials: 'include' });
      if (res.ok) {
        setLikedMessages(prev => {
          const copy = new Set(prev);
          if (copy.has(messageId)) {
            copy.delete(messageId);
          } else {
            copy.add(messageId);
          }
          return copy;
        });
      }
    } catch (e) {
      console.error('Like message failed', e);
    }
  };

  const handleLikeClickNearSend = async () => {
    // Send a dark-blue heart as a message to the conversation
    if (!selectedConversation) return;
    const heart = '💙';
    setIsSending(true);
    try {
      const url = typeof window !== 'undefined' ? `${window.location.origin}/api/messages/send` : '/api/messages/send';
      const payload = { receiverId: selectedConversation, content: heart };
      const res = await fetch(url, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to send' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const sent = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          id: sent.id,
          content: sent.content,
          time: sent.createdAt,
          isMine: true,
          sender: sent.sender,
          reactions: sent.reactions || [],
          image: sent.image || null,
          document: sent.document || null,
        },
      ]);
      // clear selection
      setSelectedMessageId(null);
    } catch (e) {
      console.error('Send heart failed', e);
      if (UI_CONFIG.SHOW_ERROR_TOAST) {
        setToast({ message: 'Impossible d\'envoyer le cœur', type: 'error' });
        setTimeout(() => setToast(null), UI_CONFIG.TOAST_DURATION || 3000);
      }
    } finally {
      setIsSending(false);
    }
  };

  const openContactInfo = () => {
    if (!selectedUser?.id) return;
    router.push(`/users/${selectedUser.id}`);
    setShowHeaderMenu(false);
  };

  const searchMessages = () => {
    const q = window.prompt('Rechercher dans la conversation (mot-clé)');
    if (!q) return;
    // backup original messages if not yet
    if (!originalMessages) setOriginalMessages(messages.slice());
    const filtered = messages.filter((m) => (m.content || '').toLowerCase().includes(q.toLowerCase()));
    setMessages(filtered);
    setShowHeaderMenu(false);
  };

  const showMedia = () => {
    setShowMediaModal(true);
    setShowHeaderMenu(false);
  };

  const deleteConversationHandler = async () => {
    if (!selectedConversation) return;
    const ok = window.confirm('Supprimer cette conversation ? Cette action est irréversible.');
    if (!ok) return;
    try {
      const url = typeof window !== 'undefined' ? `${window.location.origin}/api/messages/conversation?partnerId=${selectedConversation}` : `/api/messages/conversation?partnerId=${selectedConversation}`;
      const res = await fetch(url, { method: 'DELETE', credentials: 'include' });
      if (!res.ok) throw new Error('Failed to delete conversation');
      setMessages([]);
      setSelectedConversation(null);
      setSelectedUser(null);
      if (UI_CONFIG.SHOW_SUCCESS_TOAST) {
        setToast({ message: 'Conversation supprimée', type: 'success' });
        setTimeout(() => setToast(null), UI_CONFIG.TOAST_DURATION || 3000);
      }
    } catch (e) {
      console.error('Delete conversation failed', e);
      alert('Impossible de supprimer la conversation');
    } finally {
      setShowHeaderMenu(false);
    }
  };


  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-[calc(100vh-8rem)] flex bg-gray-50 overflow-hidden"
      >
        {/* Conversations List */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                {translation.nav.messages}
              </h1>
              <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            <FriendsMessageList
              onSelectFriend={(friendId) => {
                setSelectedConversation(friendId);
              }}
              selectedFriendId={selectedConversation}
              maxHeight="h-full"
            />
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-[9998]">
                <div className="flex items-center space-x-3">
                  <Link href={`/users/${selectedUser?.id}`} className="hover:opacity-75 transition-opacity flex-shrink-0">
                    {selectedUser?.avatar ? (
                      <img
                        src={selectedUser.avatar}
                        alt={selectedUser.fullName}
                        className="w-12 h-12 rounded-full object-cover cursor-pointer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center text-white font-bold cursor-pointer">
                        {selectedUser?.fullName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/users/${selectedUser?.id}`} className="block hover:opacity-75 transition-opacity">
                      <h2 className="font-600 text-gray-900 truncate text-lg">
                        {selectedUser?.fullName || 'Conversation'}
                      </h2>
                      <p className="text-sm text-gray-500">Actif maintenant</p>
                    </Link>
                  </div>
                  <div className="relative">
                    <button 
                      onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    {showHeaderMenu && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg z-30 border border-gray-200">
                        <button onClick={openContactInfo} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm border-b border-gray-200 transition-colors">
                          Informations du contact
                        </button>
                        <button onClick={searchMessages} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm border-b border-gray-200 transition-colors">
                          Rechercher des messages
                        </button>
                        <button onClick={showMedia} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 text-sm border-b border-gray-200 transition-colors">
                          Médias
                        </button>
                        <button onClick={deleteConversationHandler} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 text-sm transition-colors">
                          Supprimer la conversation
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 flex flex-col">
                {messages.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400">
                    <p>Aucun message. Commencez la conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`flex ${message.isMine ? 'flex-row' : 'flex-row-reverse'} items-end gap-3`}
                        onPointerDown={(e) => handleMessagePointerDown(e, message)}
                        onPointerUp={(e) => handleMessagePointerUp(e, message)}
                        onPointerLeave={(e) => handleMessagePointerCancel(e, message)}
                      >
                        {/* Avatar */}
                        <Link href={`/users/${message.sender?.id}`} className="hover:opacity-75 transition-opacity flex-shrink-0 mb-1">
                          {message.sender?.avatar ? (
                            <img
                              src={message.sender.avatar}
                              alt={message.sender.fullName}
                              className="w-10 h-10 rounded-full object-cover cursor-pointer"
                              title={message.sender.fullName}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm text-gray-600 font-bold cursor-pointer">
                              {message.sender?.fullName?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </Link>

                        {/* Message Bubble */}
                        <div 
                          className={`max-w-sm ${message.isMine ? 'items-start' : 'items-end'} flex flex-col cursor-pointer`}
                          onClick={() => setSelectedMessageId(message.id)}
                        >
                          <p className={`text-xs font-semibold mb-1 ${message.isMine ? 'text-left text-primary' : 'text-right text-gray-600'}`}>
                            {message.isMine ? 'Vous' : message.sender?.fullName}
                          </p>
                          {message.content === '💙' ? (
                            <div className="flex items-center justify-center">
                              <HeartIcon className="w-12 h-12" fill={true} />
                            </div>
                          ) : (
                            <div
                              className={`px-4 py-2 rounded-2xl font-normal leading-normal transition-colors ${
                                selectedMessageId === message.id ? 'ring-2 ring-primary' : ''
                              } ${
                                message.isMine
                                  ? 'bg-primary text-white rounded-bl-md'
                                  : 'bg-gray-200 text-gray-900 rounded-br-md'
                              }`}
                              style={{ position: 'relative' }}
                            >
                              <p className="text-sm">{message.content}</p>
                              {message.image && (
                                <img src={message.image} alt="attachment" className="w-full mt-2 rounded" />
                              )}
                              {message.document && (
                                <div className="flex items-center gap-2 mt-2">
                                  <Download className="w-4 h-4 text-blue-600" />
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const link = document.createElement('a');
                                      link.href = message.document;
                                      link.download = `attachment-${message.id}`;
                                      document.body.appendChild(link);
                                      link.click();
                                      document.body.removeChild(link);
                                    }}
                                    className="text-xs text-blue-600 underline hover:text-blue-800"
                                  >
                                    Télécharger la pièce jointe
                                  </button>
                                </div>
                              )}
                              <p className={`text-xs mt-1 opacity-70 ${
                                message.isMine ? 'text-primary-light' : 'text-gray-600'
                              }`}>
                                {new Date(message.time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                              </p>

                              {/* Reactions preview */}
                              {message.reactions && message.reactions.length > 0 && (
                                <div className="flex items-center gap-2 mt-2">
                                  {Array.from(groupReactions(message.reactions)).slice(0,5).map((r:any) => (
                                    <div key={r.emoji} className="flex items-center gap-1 bg-white/10 px-2 py-1 rounded text-sm">
                                      <span>{r.emoji}</span>
                                      <span className="text-xs text-white">{r.count}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    
                    {/* Typing Indicator */}
                    {isPartnerTyping && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-end gap-3"
                      >
                        <Link href={`/users/${selectedUser?.id}`} className="hover:opacity-75 transition-opacity flex-shrink-0 mb-1">
                          {selectedUser?.avatar ? (
                            <img
                              src={selectedUser.avatar}
                              alt={selectedUser.fullName}
                              className="w-10 h-10 rounded-full object-cover cursor-pointer"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center text-sm text-gray-600 font-bold cursor-pointer">
                              {selectedUser?.fullName?.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </Link>
                        <div className="bg-gray-200 rounded-2xl rounded-bl-md px-4 py-2">
                          <div className="flex space-x-1">
                            <motion.div
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity }}
                              className="w-2 h-2 bg-gray-600 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                              className="w-2 h-2 bg-gray-600 rounded-full"
                            />
                            <motion.div
                              animate={{ y: [0, -4, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                              className="w-2 h-2 bg-gray-600 rounded-full"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
                {sendError && (
                  <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm border border-red-200">
                    ⚠️ {sendError}
                  </div>
                )}

                {selectedMessageId && (
                  <div className="mb-3 p-2 bg-blue-50 rounded-lg text-sm border border-blue-200 flex items-center justify-between">
                    <span className="text-blue-700">Message sélectionné</span>
                    <button 
                      onClick={() => setSelectedMessageId(null)}
                      className="text-blue-600 hover:text-blue-800 text-xl"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="flex flex-col">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => handleTyping(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !isSending && handleSendMessage()}
                      placeholder="Aa"
                      disabled={isSending}
                      className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-colors disabled:bg-gray-100 text-gray-900 placeholder-gray-500"
                    />

                    <button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSending}
                      className="flex-shrink-0 p-2.5 bg-primary text-white rounded-full hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-300 flex items-center justify-center"
                    >
                      {isSending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>

                    <button
                      onClick={handleLikeClickNearSend}
                      disabled={isSending}
                      className="flex-shrink-0 ml-2 p-2.5 rounded-full transition-colors hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Envoyer un cœur"
                    >
                      <Heart className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" />
                    </button>

                    <div className="flex items-center gap-2">
                      <input id="attachmentInput" type="file" accept="image/*,.pdf,.doc,.docx" className="hidden" onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (!f) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          const data = reader.result as string;
                          if (f.type.startsWith('image/')) setAttachment({ type: 'image', dataUrl: data });
                          else setAttachment({ type: 'document', dataUrl: data });
                        };
                        reader.readAsDataURL(f);
                      }} />
                      <label htmlFor="attachmentInput" className="p-2 hover:bg-gray-100 rounded-full cursor-pointer" title="Joindre un fichier">
                        <Paperclip className="w-5 h-5 text-gray-600" />
                      </label>
                    </div>
                  </div>

                  {attachment && (
                    <div className="mt-2 flex items-center gap-2">
                      {attachment.type === 'image' ? (
                        <img src={attachment.dataUrl || ''} alt="preview" className="w-24 h-24 object-cover rounded" />
                      ) : (
                        <div className="px-3 py-2 bg-gray-100 rounded text-sm">Fichier joint</div>
                      )}
                      <button onClick={() => setAttachment(null)} className="text-sm text-red-500">Suppr.</button>
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
              <h3 className="text-2xl font-semibold mb-2">📎</h3>
              <p className="text-gray-500 text-base">Choisissez un ami pour commencer à discuter</p>
            </div>
          )}
        </div>

        {/* Long-press action menu */}
              {longPressMessage && menuPos && (
                <div style={{ position: 'fixed', left: menuPos.x, top: menuPos.y, zIndex: 9999 }}>
                  <div className="bg-white rounded-lg shadow-lg border border-gray-200">
                    <button onClick={() => reactToMessage(longPressMessage.id, '❤️')} className="block px-4 py-2 text-sm hover:bg-gray-50">❤️ Aimer</button>
                    <button onClick={() => reactToMessage(longPressMessage.id, '👍')} className="block px-4 py-2 text-sm hover:bg-gray-50">👍 J'aime</button>
                    <button onClick={() => reactToMessage(longPressMessage.id, '😂')} className="block px-4 py-2 text-sm hover:bg-gray-50">😂 Amusant</button>
                    <button onClick={() => reactToMessage(longPressMessage.id, '😢')} className="block px-4 py-2 text-sm hover:bg-gray-50">😢 Triste</button>
                    <button onClick={() => reactToMessage(longPressMessage.id, '😮')} className="block px-4 py-2 text-sm hover:bg-gray-50">😮 Surpris</button>
                    <button onClick={() => reactToMessage(longPressMessage.id, '🔥')} className="block px-4 py-2 text-sm hover:bg-gray-50">🔥 Chaud</button>
                    <button onClick={() => deleteMessage(longPressMessage.id, 'me')} className="block px-4 py-2 text-sm hover:bg-gray-50 border-t">Supprimer pour moi</button>
                    <button onClick={() => deleteMessage(longPressMessage.id, 'everyone')} className="block px-4 py-2 text-sm text-red-600 hover:bg-red-50">Supprimer pour tout le monde</button>
                    <button onClick={closeLongPressMenu} className="block px-4 py-2 text-sm hover:bg-gray-50 border-t">Annuler</button>
                  </div>
                </div>
              )}
      {/* Media Modal */}
      {showMediaModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40">
          <div className="bg-white w-[90%] max-w-3xl rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold">Médias de la conversation</h3>
              <div className="flex items-center gap-2">
                {originalMessages && (
                  <button onClick={() => { setMessages(originalMessages); setOriginalMessages(null); }} className="text-sm px-3 py-1 bg-gray-100 rounded">Réinitialiser la recherche</button>
                )}
                <button onClick={() => setShowMediaModal(false)} className="text-sm px-3 py-1 bg-gray-100 rounded">Fermer</button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 max-h-[60vh] overflow-auto">
              {messages.filter(m => m.image || m.document).length === 0 ? (
                <div className="text-gray-500">Aucun média trouvé.</div>
              ) : (
                messages.filter(m => m.image || m.document).map(m => (
                  <div key={m.id} className="border rounded p-2 flex flex-col items-start">
                    {m.image ? (
                      <img src={m.image} className="w-full h-36 object-cover rounded mb-2" />
                    ) : (
                      <div className="w-full h-36 flex items-center justify-center bg-gray-50 rounded mb-2">Fichier</div>
                    )}
                    <div className="text-xs text-gray-600 mb-1">{m.content?.slice(0,60)}</div>
                    {m.document && (
                      <a href={m.document} target="_blank" rel="noreferrer" className="text-sm text-blue-600 underline">Télécharger</a>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Toast */}
      {toast && (
        <div className="fixed z-[20000] right-6 bottom-6">
          <div className={`px-4 py-2 rounded shadow-lg text-white ${toast.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
            {toast.message}
          </div>
        </div>
      )}
      </motion.div>
    </MainLayout>
  );
}

