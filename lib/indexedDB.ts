'use client';

import React from 'react';

/**
 * IndexedDB Utilities pour le mode hors-ligne
 * Stocke les messages localement et les synchronise quand la connexion revient
 */

const DB_NAME = 'UnifyMessagesDB';
const DB_VERSION = 1;
const MESSAGES_STORE = 'messages';
const DRAFTS_STORE = 'drafts';
const PENDING_STORE = 'pendingMessages';
const METADATA_STORE = 'metadata';

export class IndexedDBManager {
  private db: IDBDatabase | null = null;

  /**
   * Initialiser la base de données
   */
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Messages cache
        if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
          const messagesStore = db.createObjectStore(MESSAGES_STORE, { keyPath: 'id' });
          messagesStore.createIndex('conversationId', 'conversationId', { unique: false });
          messagesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Brouillons non envoyés
        if (!db.objectStoreNames.contains(DRAFTS_STORE)) {
          const draftsStore = db.createObjectStore(DRAFTS_STORE, { keyPath: 'id' });
          draftsStore.createIndex('conversationId', 'conversationId', { unique: false });
        }

        // Messages en attente d'envoi
        if (!db.objectStoreNames.contains(PENDING_STORE)) {
          const pendingStore = db.createObjectStore(PENDING_STORE, { keyPath: 'id' });
          pendingStore.createIndex('conversationId', 'conversationId', { unique: false });
          pendingStore.createIndex('status', 'status', { unique: false });
        }

        // Métadonnées (dernière synchronisation, etc.)
        if (!db.objectStoreNames.contains(METADATA_STORE)) {
          db.createObjectStore(METADATA_STORE, { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Sauvegarder un message localement
   */
  async saveMessage(message: any): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);

      // Ajouter timestamp si absent
      const dataToSave = {
        ...message,
        savedAt: new Date().toISOString(),
      };

      const request = store.put(dataToSave);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Récupérer les messages d'une conversation
   */
  async getMessages(conversationId: string, limit: number = 50): Promise<any[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([MESSAGES_STORE], 'readonly');
      const store = transaction.objectStore(MESSAGES_STORE);
      const index = store.index('conversationId');

      const range = IDBKeyRange.only(conversationId);
      const request = index.getAll(range);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const messages = request.result
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, limit);
        resolve(messages);
      };
    });
  }

  /**
   * Sauvegarder un brouillon
   */
  async saveDraft(conversationId: string, content: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DRAFTS_STORE], 'readwrite');
      const store = transaction.objectStore(DRAFTS_STORE);

      const draft = {
        id: `draft_${conversationId}`,
        conversationId,
        content,
        savedAt: new Date().toISOString(),
      };

      const request = store.put(draft);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Récupérer un brouillon
   */
  async getDraft(conversationId: string): Promise<string | null> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DRAFTS_STORE], 'readonly');
      const store = transaction.objectStore(DRAFTS_STORE);

      const request = store.get(`draft_${conversationId}`);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result?.content || null);
      };
    });
  }

  /**
   * Supprimer un brouillon
   */
  async deleteDraft(conversationId: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([DRAFTS_STORE], 'readwrite');
      const store = transaction.objectStore(DRAFTS_STORE);

      const request = store.delete(`draft_${conversationId}`);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Ajouter un message à la queue d'envoi
   */
  async addToPendingQueue(message: any): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PENDING_STORE], 'readwrite');
      const store = transaction.objectStore(PENDING_STORE);

      const pendingMessage = {
        id: `pending_${Date.now()}`,
        ...message,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      const request = store.add(pendingMessage);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Récupérer les messages en attente
   */
  async getPendingMessages(conversationId?: string): Promise<any[]> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PENDING_STORE], 'readonly');
      const store = transaction.objectStore(PENDING_STORE);

      let request;
      if (conversationId) {
        const index = store.index('conversationId');
        request = index.getAll(IDBKeyRange.only(conversationId));
      } else {
        request = store.getAll();
      }

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result.filter(m => m.status === 'pending'));
      };
    });
  }

  /**
   * Marquer un message comme envoyé
   */
  async markAsSent(pendingId: string, realMessage: any): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PENDING_STORE, MESSAGES_STORE], 'readwrite');
      
      // Supprimer de pending
      const pendingStore = transaction.objectStore(PENDING_STORE);
      pendingStore.delete(pendingId);

      // Ajouter à messages
      const messagesStore = transaction.objectStore(MESSAGES_STORE);
      messagesStore.put({
        ...realMessage,
        syncedAt: new Date().toISOString(),
      });

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  /**
   * Marquer un message comme échoué
   */
  async markAsFailed(pendingId: string, error: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PENDING_STORE], 'readwrite');
      const store = transaction.objectStore(PENDING_STORE);

      const request = store.get(pendingId);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        if (request.result) {
          request.result.status = 'failed';
          request.result.error = error;
          store.put(request.result);
        }
        resolve();
      };
    });
  }

  /**
   * Sauvegarder la dernière synchronisation
   */
  async setLastSync(conversationId: string, timestamp: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([METADATA_STORE], 'readwrite');
      const store = transaction.objectStore(METADATA_STORE);

      const request = store.put({
        key: `lastSync_${conversationId}`,
        value: timestamp,
      });

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  /**
   * Récupérer la dernière synchronisation
   */
  async getLastSync(conversationId: string): Promise<string | null> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([METADATA_STORE], 'readonly');
      const store = transaction.objectStore(METADATA_STORE);

      const request = store.get(`lastSync_${conversationId}`);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        resolve(request.result?.value || null);
      };
    });
  }

  /**
   * Vider tout le cache
   */
  async clearAll(): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [MESSAGES_STORE, DRAFTS_STORE, PENDING_STORE, METADATA_STORE],
        'readwrite'
      );

      const stores = [
        transaction.objectStore(MESSAGES_STORE),
        transaction.objectStore(DRAFTS_STORE),
        transaction.objectStore(PENDING_STORE),
        transaction.objectStore(METADATA_STORE),
      ];

      stores.forEach(store => store.clear());

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }

  /**
   * Supprimer une conversation du cache
   */
  async deleteConversationCache(conversationId: string): Promise<void> {
    if (!this.db) throw new Error('IndexedDB not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(
        [MESSAGES_STORE, DRAFTS_STORE, PENDING_STORE],
        'readwrite'
      );

      // Supprimer messages
      const messagesStore = transaction.objectStore(MESSAGES_STORE);
      const messagesIndex = messagesStore.index('conversationId');
      const messagesRange = IDBKeyRange.only(conversationId);
      let messagesCursor = messagesIndex.openCursor(messagesRange);
      messagesCursor.onsuccess = () => {
        if (messagesCursor.result) {
          messagesStore.delete(messagesCursor.result.primaryKey);
          messagesCursor.result.continue();
        }
      };

      // Supprimer brouillon
      const draftsStore = transaction.objectStore(DRAFTS_STORE);
      draftsStore.delete(`draft_${conversationId}`);

      // Supprimer pending
      const pendingStore = transaction.objectStore(PENDING_STORE);
      const pendingIndex = pendingStore.index('conversationId');
      const pendingRange = IDBKeyRange.only(conversationId);
      let pendingCursor = pendingIndex.openCursor(pendingRange);
      pendingCursor.onsuccess = () => {
        if (pendingCursor.result) {
          pendingStore.delete(pendingCursor.result.primaryKey);
          pendingCursor.result.continue();
        }
      };

      transaction.onerror = () => reject(transaction.error);
      transaction.oncomplete = () => resolve();
    });
  }
}

// Singleton instance
let dbManager: IndexedDBManager | null = null;

/**
 * Récupérer ou créer l'instance IndexedDB
 */
export async function getIndexedDBManager(): Promise<IndexedDBManager> {
  if (!dbManager) {
    dbManager = new IndexedDBManager();
    await dbManager.init();
  }
  return dbManager;
}

/**
 * Hook pour utiliser IndexedDB
 */
export function useIndexedDB() {
  const [isReady, setIsReady] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    getIndexedDBManager()
      .then(() => setIsReady(true))
      .catch(err => {
        console.error('IndexedDB init error:', err);
        setError(err.message);
      });
  }, []);

  return { isReady, error, getManager: () => getIndexedDBManager() };
}
