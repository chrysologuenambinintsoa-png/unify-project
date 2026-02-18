'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { MessagesContainer, ConversationsList, MessagesAreaSkeleton } from '@/components/messaging';
import { MainLayout } from '@/components/layout/MainLayout';
import { MessageCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content?: string;
  timestamp: Date;
  isRead: boolean;
  reactions?: Array<{ emoji: string; count: number }>;
  image?: string;
  file?: { name: string; size: number; url: string };
}

interface Conversation {
  id: string;
  name: string;
  avatar: string;
  email?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
  isOnline?: boolean;
  messages?: Message[];
  type: 'direct' | 'group';
  members?: Array<{ id: string; name: string; avatar?: string }>;
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [currentMessages, setCurrentMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);


  // Fetch conversations for forward modal
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch('/api/messages/conversations');
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        }
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      }
    };
    fetchConversations();
  }, []);

  // Fetch messages for selected conversation
  useEffect(() => {
    if (!selectedConversation?.id) {
      setCurrentMessages([]);
      return;
    }

    const fetchMessages = async () => {
      setMessagesLoading(true);
      try {
        const response = await fetch(`/api/messages/conversations/${selectedConversation.id}`);
        if (!response.ok) throw new Error('Failed to fetch messages');
        const messages = await response.json();
        setCurrentMessages(messages);
      } catch (err) {
        console.error('Error fetching messages:', err);
        setCurrentMessages([]);
      } finally {
        setMessagesLoading(false);
      }
    };

    // Fetch messages only once when conversation is selected
    fetchMessages();
    
    // Do NOT poll automatically - only fetch when conversation changes
    // This prevents infinite refresh loops
  }, [selectedConversation?.id]);

  const handleSendMessage = (message: Omit<Message, 'id' | 'timestamp' | 'isRead'>) => {
    if (!selectedConversation?.id) return;

    // Send message asynchronously without blocking
    fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiverId: selectedConversation.id,
        content: message.content,
        image: message.image,
        document: message.file?.url,
      }),
    })
      .then(async (response) => {
        if (response.ok) {
          // Don't manually add message - let polling pick it up
          // This prevents duplicates and keeps state consistent
          const newMessage = await response.json();
          console.log('Message sent successfully:', newMessage.id);
        }
      })
      .catch((err) => {
        console.error('Error sending message:', err);
      });
  };

  const handleMobileClose = () => {
    setSelectedConversation(null);
  };



  return (
    <MainLayout>
      <div className="h-[calc(100vh-8rem)] flex bg-gray-50 dark:bg-black overflow-hidden">
        {/* Conversations List - Hidden on mobile when conversation selected */}
        <motion.div
          initial={false}
          animate={{ x: selectedConversation && window.innerWidth < 768 ? '-100%' : 0 }}
          className="w-full md:w-96 lg:w-[420px] flex-shrink-0 border-r border-gray-200 dark:border-gray-700"
        >
          <ConversationsList
            selectedId={selectedConversation?.id}
            onSelectConversation={setSelectedConversation}
          />
        </motion.div>

        {/* Messages Area */}
        <div className="hidden md:flex flex-1 bg-white dark:bg-primary-dark overflow-hidden pl-4 lg:pl-6">
          {selectedConversation ? (
            messagesLoading ? (
              <MessagesAreaSkeleton />
            ) : (
              <MessagesContainer
                conversationId={selectedConversation.id}
                currentUserId={session?.user?.id || 'current-user'}
                currentUserName={session?.user?.name || 'You'}
                currentUserAvatar={session?.user?.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser'}
                recipientId={selectedConversation.id}
                recipientName={selectedConversation.name}
                recipientAvatar={selectedConversation.avatar}
                onSendMessage={handleSendMessage}
                messages={currentMessages}
                conversations={conversations}
              />
            )
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Sélectionnez une conversation</p>
              <p className="text-sm mt-2">Choisissez une discussion pour commencer à chatter</p>
            </div>
          )}
        </div>

        {/* Mobile View - Show conversation when selected */}
        {selectedConversation && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            className="md:hidden absolute inset-0 bg-white dark:bg-primary-dark z-50 flex flex-col"
          >
            {/* Mobile Header */}
            <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={handleMobileClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">{selectedConversation.name}</h3>
              </div>
            </div>

            <div className="flex-1 overflow-hidden">
              {messagesLoading ? (
                <MessagesAreaSkeleton />
              ) : (
                <MessagesContainer
                  conversationId={selectedConversation.id}
                  currentUserId={session?.user?.id || 'current-user'}
                  currentUserName={session?.user?.name || 'You'}
                  currentUserAvatar={session?.user?.image || 'https://api.dicebear.com/7.x/avataaars/svg?seed=CurrentUser'}
                  recipientId={selectedConversation.id}
                  recipientName={selectedConversation.name}
                  recipientAvatar={selectedConversation.avatar}
                  onSendMessage={handleSendMessage}
                  messages={currentMessages}
                  conversations={conversations}
                />
              )}
            </div>
          </motion.div>
        )}
      </div>


    </MainLayout>
  );
}
