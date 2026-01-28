'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { MessageCircle, Search, MoreVertical, Send } from 'lucide-react';

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
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/messages');
      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }
      const data = await response.json();
      setConversations(data.conversations);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const messages = [
    {
      id: '1',
      sender: 'Alice Johnson',
      content: 'Salut ! Comment ça va ?',
      time: '14:30',
      isMine: false,
    },
    {
      id: '2',
      sender: 'Moi',
      content: 'Salut Alice ! Ça va bien merci, et toi ?',
      time: '14:32',
      isMine: true,
    },
    {
      id: '3',
      sender: 'Alice Johnson',
      content: 'Super ! Je travaille sur un nouveau projet React',
      time: '14:33',
      isMine: false,
    },
    {
      id: '4',
      sender: 'Alice Johnson',
      content: 'Tu veux qu\'on en discute ?',
      time: '14:33',
      isMine: false,
    },
  ];

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      // TODO: Implement send message
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="h-[calc(100vh-8rem)] flex bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      >
        {/* Conversations List */}
        <div className="w-1/3 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-bold text-gray-900">
                {translation.nav.messages}
              </h1>
              <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Rechercher des conversations..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-gray-500">Chargement...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className="text-red-500">{error}</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center">
                <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune conversation</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => setSelectedConversation(conversation.id)}
                  className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedConversation === conversation.id
                      ? 'bg-primary/5 border-r-2 border-r-primary'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={conversation.user.avatar}
                        alt={conversation.user.fullName}
                        className="w-12 h-12 rounded-full"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">
                          {conversation.user.fullName}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {new Date(conversation.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>
                    {conversation.unread > 0 && (
                      <div className="w-5 h-5 bg-primary text-white text-xs rounded-full flex items-center justify-center">
                        {conversation.unread}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <img
                    src={conversations.find(c => c.id === selectedConversation)?.user.avatar}
                    alt={conversations.find(c => c.id === selectedConversation)?.user.fullName}
                    className="w-10 h-10 rounded-full"
                  />
                  <div>
                    <h2 className="font-medium text-gray-900">
                      {conversations.find(c => c.id === selectedConversation)?.user.fullName}
                    </h2>
                    <p className="text-sm text-gray-500">
                      @{conversations.find(c => c.id === selectedConversation)?.user.username}
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isMine
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className={`text-xs mt-1 ${message.isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                        {message.time}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Écrivez un message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Sélectionnez une conversation
                </h3>
                <p className="text-gray-500">
                  Choisissez une conversation pour commencer à discuter
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </MainLayout>
  );
}