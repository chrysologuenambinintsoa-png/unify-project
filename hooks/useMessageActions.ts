import { useCallback, useRef, useEffect } from 'react';
import { useMessages } from '@/contexts/MessagesContext';

export function useMessageActions() {
  const {
    sendMessage,
    deleteMessage,
    likeMessage,
    reactToMessage,
    markConversationAsRead,
    selectedConversation,
  } = useMessages();

  const sendMessageWithValidation = useCallback(async (content: string, attachment?: any) => {
    if (!content.trim() && !attachment) {
      throw new Error('Message cannot be empty');
    }
    
    await sendMessage(content, attachment);
  }, [sendMessage]);

  const handleDeleteMessage = useCallback(async (messageId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce message?')) {
      await deleteMessage(messageId);
    }
  }, [deleteMessage]);

  const handleReactToMessage = useCallback(async (messageId: string, emoji: string) => {
    await reactToMessage(messageId, emoji);
  }, [reactToMessage]);

  const markCurrentConversationAsRead = useCallback(async () => {
    if (selectedConversation) {
      await markConversationAsRead(selectedConversation);
    }
  }, [selectedConversation, markConversationAsRead]);

  return {
    sendMessageWithValidation,
    handleDeleteMessage,
    handleReactToMessage,
    likeMessage,
    markCurrentConversationAsRead,
  };
}

export function useTypingIndicator(userId: string) {
  const { setIsPartnerTyping } = useMessages();
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showTypingIndicator = useCallback((duration: number = 3000) => {
    setIsPartnerTyping(true);
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsPartnerTyping(false);
    }, duration);
  }, [setIsPartnerTyping]);

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return { showTypingIndicator };
}

export function useMessageSearch() {
  const { messages } = useMessages();

  const searchMessages = useCallback((query: string) => {
    if (!query.trim()) return messages;
    
    const lowerQuery = query.toLowerCase();
    return messages.filter(msg => 
      msg.content.toLowerCase().includes(lowerQuery) ||
      msg.sender.fullName.toLowerCase().includes(lowerQuery)
    );
  }, [messages]);

  return { searchMessages };
}

export function useMessageFilters() {
  const { messages, currentUserId } = useMessages();

  const filterByUser = useCallback((userId: string) => {
    return messages.filter(msg => msg.sender.id === userId);
  }, [messages]);

  const filterUnread = useCallback(() => {
    return messages.filter(msg => !msg.isRead && msg.sender.id !== currentUserId);
  }, [messages, currentUserId]);

  const filterByTime = useCallback((hours: number) => {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return messages.filter(msg => new Date(msg.time) > cutoffTime);
  }, [messages]);

  const filterMyMessages = useCallback(() => {
    return messages.filter(msg => msg.sender.id === currentUserId);
  }, [messages, currentUserId]);

  return {
    filterByUser,
    filterUnread,
    filterByTime,
    filterMyMessages,
  };
}

export function useMessagePagination(itemsPerPage: number = 20) {
  const { messages } = useMessages();

  const getPaginatedMessages = useCallback((page: number) => {
    const startIndex = page * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return messages.slice(startIndex, endIndex);
  }, [messages, itemsPerPage]);

  const getTotalPages = useCallback(() => {
    return Math.ceil(messages.length / itemsPerPage);
  }, [messages, itemsPerPage]);

  return {
    getPaginatedMessages,
    getTotalPages,
  };
}
