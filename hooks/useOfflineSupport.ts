import { useEffect, useState, useCallback, useRef } from 'react';
import { useMessages } from '@/contexts/MessagesContext';
import { getIndexedDBManager } from '@/lib/indexedDB';
import { useWebSocket } from '@/hooks/useWebSocket';

interface OfflineState {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime?: string;
  errors: string[];
}

/**
 * Hook pour gérer le mode hors-ligne et la synchronisation
 * Utilise IndexedDB pour stocker localement et WebSocket pour synchroniser
 */
export function useOfflineSupport(userId: string, conversationId: string) {
  const { messages, addMessage } = useMessages();
  const { sendMessage } = useWebSocket(userId, conversationId);
  
  const [offlineState, setOfflineState] = useState<OfflineState>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    isSyncing: false,
    pendingCount: 0,
    errors: [],
  });

  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dbManagerRef = useRef<any>(null);

  /**
   * Initialiser le gestionnaire IndexedDB
   */
  useEffect(() => {
    const init = async () => {
      try {
        dbManagerRef.current = await getIndexedDBManager();
        
        // Charger les messages du cache
        const cachedMessages = await dbManagerRef.current?.getMessages(conversationId, 100);
        if (cachedMessages.length > 0) {
          console.log(`Loaded ${cachedMessages.length} cached messages for ${conversationId}`);
        }

        // Charger les messages en attente
        const pending = await dbManagerRef.current?.getPendingMessages(conversationId);
        setOfflineState(prev => ({ ...prev, pendingCount: pending.length }));
      } catch (error: any) {
        console.error('Failed to initialize IndexedDB:', error);
        setOfflineState(prev => ({
          ...prev,
          errors: [...prev.errors, `IndexedDB error: ${error.message}`],
        }));
      }
    };

    init();
  }, [conversationId]);

  /**
   * Écouter les changements de connectivité
   */
  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 Connection restored');
      setOfflineState(prev => ({ ...prev, isOnline: true }));
      // Synchroniser immédiatement
      syncPendingMessages();
    };

    const handleOffline = () => {
      console.log('🔴 Connection lost');
      setOfflineState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /**
   * Sauvegarder un message localement avant envoi
   */
  const saveMessageLocally = useCallback(
    async (content: string) => {
      if (!dbManagerRef.current) return;

      try {
        await dbManagerRef.current?.addToPendingQueue({
          conversationId,
          content,
          timestamp: new Date().toISOString(),
        });

        // Mettre à jour le compteur
        const pending = await dbManagerRef.current?.getPendingMessages(conversationId);
        setOfflineState(prev => ({ ...prev, pendingCount: pending.length }));
      } catch (error: any) {
        console.error('Failed to save message locally:', error);
        throw error;
      }
    },
    [conversationId]
  );

  /**
   * Synchroniser les messages en attente
   */
  const syncPendingMessages = useCallback(async () => {
    if (!dbManagerRef.current) return;

    setOfflineState(prev => ({ ...prev, isSyncing: true }));

    try {
      const pendingMessages = await dbManagerRef.current?.getPendingMessages(conversationId) || [];

      if (pendingMessages.length === 0) {
        console.log('No pending messages to sync');
        setOfflineState(prev => ({ ...prev, isSyncing: false }));
        return;
      }

      console.log(`Syncing ${pendingMessages.length} pending messages...`);

      // Envoyer chaque message en attente
      for (const pendingMsg of pendingMessages) {
        try {
          // Essayer d'envoyer via WebSocket
          const response = await sendMessage(pendingMsg.content, conversationId);

          // Marquer comme envoyé
          await dbManagerRef.current?.markAsSent(pendingMsg.id, response);
          console.log(`✅ Message sent: ${pendingMsg.id}`);
        } catch (error: any) {
          // Marquer comme échoué
          await dbManagerRef.current?.markAsFailed(
            pendingMsg.id,
            error.message || 'Failed to send'
          );
          console.error(`❌ Failed to send message: ${pendingMsg.id}`, error);
        }
      }

      // Mettre à jour le statut
      const remaining = await dbManagerRef.current?.getPendingMessages(conversationId) || [];
      setOfflineState(prev => ({
        ...prev,
        isSyncing: false,
        pendingCount: remaining.length,
        lastSyncTime: new Date().toISOString(),
      }));
    } catch (error: any) {
      console.error('Sync error:', error);
      setOfflineState(prev => ({
        ...prev,
        isSyncing: false,
        errors: [...prev.errors, error.message],
      }));
    }
  }, [conversationId, offlineState.isOnline, sendMessage]);

  /**
   * Sauvegarder un brouillon
   */
  const saveDraft = useCallback(
    async (content: string) => {
      if (!dbManagerRef.current) return;

      try {
        await dbManagerRef.current?.saveDraft(conversationId, content);
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    },
    [conversationId]
  );

  /**
   * Récupérer un brouillon sauvegardé
   */
  const getDraft = useCallback(async () => {
    if (!dbManagerRef.current) return null;

    try {
      return await dbManagerRef.current?.getDraft(conversationId);
    } catch (error) {
      console.error('Failed to get draft:', error);
      return null;
    }
  }, [conversationId]);

  /**
   * Supprimer un brouillon
   */
  const deleteDraft = useCallback(async () => {
    if (!dbManagerRef.current) return;

    try {
      await dbManagerRef.current?.deleteDraft(conversationId);
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  }, [conversationId]);

  /**
   * Rejeter les erreurs
   */
  const clearErrors = useCallback(() => {
    setOfflineState(prev => ({ ...prev, errors: [] }));
  }, []);

  /**
   * Nettoyer le cache de cette conversation
   */
  const clearConversationCache = useCallback(async () => {
    if (!dbManagerRef.current) return;

    try {
      await dbManagerRef.current?.deleteConversationCache(conversationId);
      console.log('Conversation cache cleared');
    } catch (error) {
      console.error('Failed to clear conversation cache:', error);
    }
  }, [conversationId]);

  /**
   * Retry bouton - réessayer d'envoyer tous les messages échoués
   */
  const retryFailedMessages = useCallback(async () => {
    if (!dbManagerRef.current) {
      console.warn('Cannot retry: offline or IndexedDB not ready');
      return;
    }

    try {
      const allPending = await dbManagerRef.current?.getPendingMessages(conversationId) || [];
      const failed = allPending.filter((m: any) => m.status === 'failed');

      if (failed.length === 0) return;

      console.log(`Retrying ${failed.length} failed messages...`);

      // Marquer comme pending à nouveau
      for (const msg of failed) {
        msg.status = 'pending';
        msg.error = undefined;
      }

      // Puis synchroniser
      await syncPendingMessages();
    } catch (error) {
      console.error('Retry error:', error);
    }
  }, [conversationId, offlineState.isOnline, syncPendingMessages]);

  // Syncer automatiquement quand la connexion revient
  useEffect(() => {
    if (offlineState.isOnline && offlineState.pendingCount > 0) {
      syncTimeoutRef.current = setTimeout(() => {
        syncPendingMessages();
      }, 1000);

      return () => {
        if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      };
    }
  }, [offlineState.isOnline, offlineState.pendingCount, syncPendingMessages]);

  return {
    // État
    ...offlineState,
    
    // Méthodes
    saveMessageLocally,
    syncPendingMessages,
    saveDraft,
    getDraft,
    deleteDraft,
    clearErrors,
    clearConversationCache,
    retryFailedMessages,
    
    // Accès au manager
    getDBManager: () => dbManagerRef.current,
  };
}
