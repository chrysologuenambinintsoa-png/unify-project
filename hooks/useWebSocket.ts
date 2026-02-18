import { useEffect, useRef, useCallback } from 'react';
import { useMessages } from '@/contexts/MessagesContext';

interface WebSocketMessage {
  type: 'message' | 'typing' | 'reaction' | 'read' | 'delete' | 'user_online' | 'user_offline';
  data: any;
  userId?: string;
  timestamp: number;
}

export function useWebSocket(userId: string | null, conversationId: string | null) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelayRef = useRef(1000);

  const { addMessage, setIsPartnerTyping, reactToMessage } = useMessages();

  const connect = useCallback(() => {
    if (!userId || !conversationId) return;

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const wsUrl = `${protocol}://${window.location.host}/api/messages/ws?userId=${userId}&conversationId=${conversationId}`;

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        reconnectAttemptRef.current = 0;
        reconnectDelayRef.current = 1000;

        // Envoyer hello handshake
        wsRef.current?.send(
          JSON.stringify({
            type: 'hello',
            userId,
            conversationId,
            timestamp: Date.now(),
          })
        );
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);

          switch (message.type) {
            case 'message':
              // Nouveau message reçu
              addMessage(message.data);
              break;

            case 'typing':
              // L'autre utilisateur est en train de taper
              setIsPartnerTyping(message.data.isTyping);
              break;

            case 'reaction':
              // Réaction à un message
              reactToMessage(message.data.messageId, message.data.emoji);
              break;

            case 'read':
              // Message marqué comme lu
              console.log(`✓ Message read: ${message.data.messageId}`);
              break;

            case 'delete':
              // Message supprimé
              console.log(`🗑️ Message deleted: ${message.data.messageId}`);
              break;

            case 'user_online':
              console.log(`👤 User online: ${message.data.userId}`);
              break;

            case 'user_offline':
              console.log(`👤 User offline: ${message.data.userId}`);
              break;

            default:
              console.warn('Unknown message type:', message.type);
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        attemptReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      attemptReconnect();
    }
  }, [userId, conversationId, addMessage, setIsPartnerTyping, reactToMessage]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptRef.current < maxReconnectAttempts) {
      reconnectAttemptRef.current++;
      console.log(
        `🔄 Reconnecting... (${reconnectAttemptRef.current}/${maxReconnectAttempts}) in ${reconnectDelayRef.current}ms`
      );

      setTimeout(() => {
        connect();
      }, reconnectDelayRef.current);

      // Augmenter le délai exponentiellement
      reconnectDelayRef.current = Math.min(reconnectDelayRef.current * 2, 10000);
    } else {
      console.error('❌ Max reconnection attempts reached');
    }
  }, [connect]);

  const sendMessage = useCallback(
    (type: string, data: any) => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type,
            data,
            userId,
            conversationId,
            timestamp: Date.now(),
          })
        );
      } else {
        console.warn('WebSocket is not open. ReadyState:', wsRef.current?.readyState);
      }
    },
    [userId, conversationId]
  );

  const sendTypingIndicator = useCallback(
    (isTyping: boolean) => {
      sendMessage('typing', { isTyping });
    },
    [sendMessage]
  );

  const sendReaction = useCallback(
    (messageId: string, emoji: string) => {
      sendMessage('reaction', { messageId, emoji });
    },
    [sendMessage]
  );

  const markAsRead = useCallback(
    (messageId: string) => {
      sendMessage('read', { messageId });
    },
    [sendMessage]
  );

  const deleteMessage = useCallback(
    (messageId: string) => {
      sendMessage('delete', { messageId });
    },
    [sendMessage]
  );

  const isConnected = wsRef.current?.readyState === WebSocket.OPEN;

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return {
    isConnected,
    sendMessage,
    sendTypingIndicator,
    sendReaction,
    markAsRead,
    deleteMessage,
  };
}

export function useWebSocketTyping(delay: number = 2000) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = useRef(false);
  const { sendTypingIndicator } = useWebSocket(null, null);

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingIndicator(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTypingIndicator(false);
    }, delay);
  }, [delay, sendTypingIndicator]);

  const stopTyping = useCallback(() => {
    isTypingRef.current = false;
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingIndicator(false);
  }, [sendTypingIndicator]);

  return { startTyping, stopTyping };
}
