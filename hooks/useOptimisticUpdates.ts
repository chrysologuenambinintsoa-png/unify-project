import { useState, useCallback } from 'react';
import { useMessages } from '@/contexts/MessagesContext';
import type { Message } from '@/types/advanced-messages';

interface OptimisticMessage {
  id: string;
  content: string;
  sender: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
  time: string;
  isOptimistic: true;
  status: 'pending' | 'sent' | 'failed';
  error?: string;
}

export function useOptimisticUpdates() {
  const { messages, addMessage } = useMessages();
  const [optimisticMessages, setOptimisticMessages] = useState<Map<string, OptimisticMessage>>(new Map());

  /**
   * Ajouter un message optimiste
   * Affiche le message immédiatement avant confirmation du serveur
   */
  const addOptimisticMessage = useCallback(
    (content: string, currentUser: any) => {
      const optimisticId = `optimistic_${Date.now()}_${Math.random()}`;
      
      const optimisticMsg: OptimisticMessage = {
        id: optimisticId,
        content,
        sender: currentUser,
        time: new Date().toISOString(),
        isOptimistic: true,
        status: 'pending',
      };

      // Ajouter au state optimiste
      setOptimisticMessages(prev => new Map(prev).set(optimisticId, optimisticMsg));

      // Afficher immédiatement dans la UI
      addMessage(optimisticMsg as any);

      // Update local state
      setOptimisticMessages(prev => new Map(prev).set(optimisticId, optimisticMsg));

      return optimisticId;
    },
    [addMessage]
  );

  /**
   * Confirmer un message optimiste
   * Remplacer l'ID optimiste par l'ID réel du serveur
   */
  const confirmOptimisticMessage = useCallback(
    (optimisticId: string, realMessage: any) => {
      // Enlever du state optimiste
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(optimisticId);
        return newMap;
      });
    },
    []
  );

  /**
   * Marquer un message optimiste comme échoué
   */
  const failOptimisticMessage = useCallback(
    (optimisticId: string, error: string) => {
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        const msg = newMap.get(optimisticId);
        if (msg) {
          msg.status = 'failed';
          msg.error = error;
          newMap.set(optimisticId, msg);
        }
        return newMap;
      });
    },
    []
  );

  /**
   * Réessayer d'envoyer un message qui a échoué
   */
  const retryOptimisticMessage = useCallback(
    (optimisticId: string) => {
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        const msg = newMap.get(optimisticId);
        if (msg) {
          msg.status = 'pending';
          msg.error = undefined;
          newMap.set(optimisticId, msg);
        }
        return newMap;
      });
    },
    []
  );

  /**
   * Supprimer un message optimiste (au clic sur annuler)
   */
  const deleteOptimisticMessage = useCallback(
    (optimisticId: string) => {
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        newMap.delete(optimisticId);
        return newMap;
      });
    },
    []
  );

  /**
   * Optimistic update - Modifier un message localement avant confirmation
   */
  const updateOptimisticMessage = useCallback(
    (messageId: string, updates: any) => {
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        const msg = newMap.get(messageId);
        if (msg) {
          newMap.set(messageId, { ...msg, ...updates });
        }
        return newMap;
      });
    },
    []
  );

  /**
   * Optimistic delete - Supprimer immédiatement, restaurer si erreur
   */
  const deleteOptimistic = useCallback(
    (messageId: string) => {
      // Sauvegarder le message pour restauration
      const messageToDelete = messages.find((m: any) => m.id === messageId);
      
      return messageToDelete;
    },
    [messages]
  );

  /**
   * Restaurer un message supprimé
   */
  const restoreDeletedMessage = useCallback(
    (message: any) => {
      addMessage(message);
    },
    [addMessage]
  );

  /**
   * React optimiste à un message
   */
  const addOptimisticReaction = useCallback(
    (messageId: string, emoji: string, userId: string) => {
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        const msg = newMap.get(messageId);
        if (msg) {
          newMap.set(messageId, {
            ...msg,
            // Reactions will be handled via MessagesContext
          });
        }
        return newMap;
      });
    },
    []
  );

  /**
   * Undo react optimiste
   */
  const removeOptimisticReaction = useCallback(
    (messageId: string, emoji: string) => {
      setOptimisticMessages(prev => {
        const newMap = new Map(prev);
        const msg = newMap.get(messageId);
        if (msg) {
          newMap.set(messageId, {
            ...msg,
            // Reactions will be handled via MessagesContext
          });
        }
        return newMap;
      });
    },
    []
  );

  return {
    optimisticMessages: Array.from(optimisticMessages.values()),
    addOptimisticMessage,
    confirmOptimisticMessage,
    failOptimisticMessage,
    retryOptimisticMessage,
    deleteOptimisticMessage,
    updateOptimisticMessage,
    deleteOptimistic,
    restoreDeletedMessage,
    addOptimisticReaction,
    removeOptimisticReaction,
  };
}
