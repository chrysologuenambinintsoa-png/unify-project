type SSEClient = {
  id: string;
  userId?: string;
  res: any;
};

const clients: SSEClient[] = [];

export function addClient(id: string, res: any, userId?: string) {
  clients.push({ id, res, userId });
}

export function removeClient(id: string) {
  const idx = clients.findIndex(c => c.id === id);
  if (idx !== -1) clients.splice(idx, 1);
}

export function publish(event: string, data: any) {
  const payload = `event: ${event}\n` + `data: ${JSON.stringify(data)}\n\n`;
  for (const client of clients) {
    try {
      client.res.write(payload);
    } catch (e) {
      // ignore write errors
    }
  }
}

// Publish notification to a specific user
export function publishNotificationToUser(userId: string, notification: any) {
  const payload = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
  for (const client of clients) {
    if (client.userId === userId) {
      try {
        client.res.enqueue(new TextEncoder().encode(payload));
      } catch (e) {
        // ignore write errors
      }
    }
  }
}

// Publish notification to multiple users
export function publishNotificationToUsers(userIds: string[], notification: any) {
  const payload = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
  for (const userId of userIds) {
    for (const client of clients) {
      if (client.userId === userId) {
        try {
          client.res.enqueue(new TextEncoder().encode(payload));
        } catch (e) {
          // ignore write errors
        }
      }
    }
  }
}

export function getClientCount() {
  return clients.length;
}
