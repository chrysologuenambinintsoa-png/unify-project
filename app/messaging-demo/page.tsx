'use client';

import React, { useState } from 'react';
import { MessagesContainer } from '@/components/messaging';
import { MainLayout } from '@/components/layout/MainLayout';

export default function MessagingDemo() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      senderId: 'user1',
      senderName: 'Alice',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
      content: 'Salut! Comment ça va? 👋',
      timestamp: new Date(Date.now() - 5 * 60000),
      isRead: true,
      reactions: [{ emoji: '❤️', count: 1 }],
    },
    {
      id: '2',
      senderId: 'currentUser',
      senderName: 'You',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
      content: 'Salut Alice! Tout va bien, et toi? 😊',
      timestamp: new Date(Date.now() - 4 * 60000),
      isRead: true,
      reactions: [],
    },
    {
      id: '3',
      senderId: 'user1',
      senderName: 'Alice',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
      content: 'Très bien! Je viens de créer le nouveau composant de messagerie 🚀',
      timestamp: new Date(Date.now() - 3 * 60000),
      isRead: true,
      reactions: [{ emoji: '🔥', count: 2 }],
    },
    {
      id: '4',
      senderId: 'currentUser',
      senderName: 'You',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=You',
      image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop',
      content: 'Regarde ce que j\'ai trouvé!',
      timestamp: new Date(Date.now() - 2 * 60000),
      isRead: true,
      reactions: [{ emoji: '👍', count: 1 }],
    },
    {
      id: '5',
      senderId: 'user1',
      senderName: 'Alice',
      senderAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice',
      content: 'C\'est magnifique! 😍',
      timestamp: new Date(),
      isRead: false,
      reactions: [],
    },
  ]);

  const handleSendMessage = (newMessage: any) => {
    console.log('Message envoyé:', newMessage);
  };

  return (
    <MainLayout>
      <div className="h-[calc(100vh-8rem)] flex">
        <MessagesContainer
          conversationId="conv-1"
          currentUserId="currentUser"
          currentUserName="You"
          currentUserAvatar="https://api.dicebear.com/7.x/avataaars/svg?seed=You"
          recipientName="Alice"
          recipientAvatar="https://api.dicebear.com/7.x/avataaars/svg?seed=Alice"
          onSendMessage={handleSendMessage}
          messages={messages}
        />
      </div>
    </MainLayout>
  );
}
