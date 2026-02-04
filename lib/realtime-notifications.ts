/**
 * Gestion des notifications en temps réel via SSE
 */

interface Client {
  userId: string;
  response: ResponseInit & { body?: ReadableStream<any> };
  controller: ReadableStreamDefaultController<any>;
}

const clients: Map<string, Client[]> = new Map();

/**
 * Enregistre un client pour recevoir les notifications SSE
 */
export function registerSSEClient(userId: string, controller: ReadableStreamDefaultController<any>) {
  if (!clients.has(userId)) {
    clients.set(userId, []);
  }

  const client = { userId, controller, response: {} };
  clients.get(userId)?.push(client);

  return () => {
    const userClients = clients.get(userId);
    if (userClients) {
      const index = userClients.indexOf(client);
      if (index > -1) {
        userClients.splice(index, 1);
      }
    }
  };
}

/**
 * Envoie une notification à un utilisateur spécifique
 */
export async function notifyClients(userId: string, data: any) {
  const userClients = clients.get(userId);
  if (!userClients || userClients.length === 0) {
    console.log(`No active SSE clients for user ${userId}`);
    return;
  }

  const message = `data: ${JSON.stringify(data)}\n\n`;

  // Envoyer le message à tous les clients de cet utilisateur
  for (const client of userClients) {
    try {
      client.controller.enqueue(message);
    } catch (error) {
      console.error('Error sending SSE message:', error);
    }
  }
}

/**
 * Envoie une notification à plusieurs utilisateurs
 */
export async function notifyMultipleUsers(userIds: string[], data: any) {
  for (const userId of userIds) {
    await notifyClients(userId, data);
  }
}

/**
 * Vérifie et nettoie les clients inactifs
 */
export function cleanupInactiveClients() {
  for (const [userId, userClients] of clients.entries()) {
    const activeClients = userClients.filter(client => {
      try {
        return client.controller ? true : false;
      } catch {
        return false;
      }
    });

    if (activeClients.length === 0) {
      clients.delete(userId);
    } else if (activeClients.length < userClients.length) {
      clients.set(userId, activeClients);
    }
  }
}

// Nettoyer les clients inactifs toutes les 5 minutes
setInterval(cleanupInactiveClients, 5 * 60 * 1000);
