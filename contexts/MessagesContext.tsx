import React, { createContext, useState, useCallback, ReactNode, useRef, useEffect } from 'react';

interface Message {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  time: string;
  replyTo?: Message | null;
  attachments?: Array<{ type: 'image' | 'document'; dataUrl: string }>;
  reactions?: Array<{ emoji: string; count: number; userIds: string[] }>;
  isRead: boolean;
}

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

interface MessagesContextType {
  // State
  conversations: Conversation[];
  messages: Message[];
  selectedConversation: string | null;
  selectedUser: any | null;
  currentUserId: string | null;
  loading: boolean;
  isSending: boolean;
  isPartnerTyping: boolean;
  likedMessages: Set<string>;
  
  // Actions
  setSelectedConversation: (id: string | null) => void;
  setSelectedUser: (user: any | null) => void;
  setCurrentUserId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  sendMessage: (content: string, attachment?: any) => Promise<void>;
  updateMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  deleteMessage: (messageId: string) => Promise<void>;
  likeMessage: (messageId: string) => void;
  reactToMessage: (messageId: string, emoji: string) => Promise<void>;
  setIsPartnerTyping: (typing: boolean) => void;
  markConversationAsRead: (conversationId: string) => Promise<void>;
  fetchConversations: () => Promise<void>;
  fetchMessages: (conversationId: string) => Promise<void>;
}

export const MessagesContext = createContext<MessagesContextType | undefined>(undefined);

export function MessagesProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string, attachment?: any) => {
    if (!selectedConversation || !currentUserId) return;
    
    setIsSending(true);
    try {
      const response = await fetch(`/api/messages/${selectedConversation}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, attachment }),
      });
      
      if (response.ok) {
        const newMessage = await response.json();
        addMessage(newMessage);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  }, [selectedConversation, currentUserId]);

  const updateMessages = useCallback((newMessages: Message[]) => {
    setMessages(newMessages);
  }, []);

  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message]);
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    try {
      await fetch(`/api/messages/${messageId}`, { method: 'DELETE' });
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, []);

  const likeMessage = useCallback((messageId: string) => {
    setLikedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  }, []);

  const reactToMessage = useCallback(async (messageId: string, emoji: string) => {
    try {
      await fetch(`/api/messages/${messageId}/react`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji }),
      });
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  }, []);

  const markConversationAsRead = useCallback(async (conversationId: string) => {
    try {
      await fetch(`/api/messages/${conversationId}/read`, { method: 'PATCH' });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/messages/conversations');
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/messages/${conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <MessagesContext.Provider
      value={{
        conversations,
        messages,
        selectedConversation,
        selectedUser,
        currentUserId,
        loading,
        isSending,
        isPartnerTyping,
        likedMessages,
        setSelectedConversation,
        setSelectedUser,
        setCurrentUserId,
        setLoading,
        sendMessage,
        updateMessages,
        addMessage,
        deleteMessage,
        likeMessage,
        reactToMessage,
        setIsPartnerTyping,
        markConversationAsRead,
        fetchConversations,
        fetchMessages,
      }}
    >
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages() {
  const context = React.useContext(MessagesContext);
  if (!context) {
    throw new Error('useMessages must be used within MessagesProvider');
  }
  return context;
}
