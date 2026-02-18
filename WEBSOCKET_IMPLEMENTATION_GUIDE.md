/**
 * WebSocket Endpoint for Real-Time Messaging
 * 
 * Routes: POST /api/messages/ws
 * Handles: WebSocket upgrade + message routing
 * 
 * TODO: Implement this file to complete WebSocket integration
 */

import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

// Types for WebSocket messages
interface WebSocketMessage {
  type: 'message' | 'typing' | 'reaction' | 'read' | 'delete' | 'user_online' | 'user_offline';
  payload: any;
  timestamp: string;
}

interface ConnectedClient {
  userId: string;
  conversationId: string;
  ws: WebSocket;
  isAlive: boolean;
}

// In-memory store of connected clients
const connectedClients = new Map<string, ConnectedClient[]>();

/**
 * Handle WebSocket upgrade
 * 
 * IMPLEMENTATION NEEDED:
 * 1. Validate user session
 * 2. Extract userId and conversationId from params/query
 * 3. Upgrade HTTP to WebSocket
 * 4. Store client in connectedClients map
 * 5. Set up message handlers
 * 6. Clean up on disconnect
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Validate session
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    const conversationId = req.nextUrl.searchParams.get('conversationId');

    if (!conversationId) {
      return new Response('Missing conversationId', { status: 400 });
    }

    // 2. Check if browser supports WebSocket
    const upgradeHeader = req.headers.get('upgrade');
    if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
      return new Response('WebSocket required', { status: 400 });
    }

    // 3. Upgrade to WebSocket (NEEDS IMPLEMENTATION)
    // Note: Next.js doesn't natively support WebSockets in the App Router
    // Options:
    // a) Use a separate WebSocket server (socket.io, ws library)
    // b) Use a third-party service (Socket.io Cloud, Pusher, Ably)
    // c) Use Vercel KV Pub/Sub with polling
    // d) Use Next.js middleware with external WS handler

    // TEMPORARY RESPONSE
    console.log(`WebSocket connection attempt from user ${userId} to conversation ${conversationId}`);

    return new Response(
      JSON.stringify({
        error: 'WebSocket endpoint not yet implemented',
        note: 'Choose implementation: socket.io, ws library, or third-party service',
      }),
      { status: 501, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('WebSocket endpoint error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

/**
 * IMPLEMENTATION OPTIONS
 * ========================
 *
 * Option A: Socket.IO (Recommended for Next.js)
 * ============================================
 *
 * Installation:
 *   npm install socket.io socket.io-client
 *
 * Create: lib/socket-server.ts
 * ----
 * import { Server } from 'socket.io';
 *
 * export function initializeSocketServer(httpServer: any) {
 *   const io = new Server(httpServer, {
 *     cors: { origin: '*' },
 *   });
 *
 *   io.on('connection', (socket) => {
 *     console.log('Client connected:', socket.id);
 *
 *     // Join conversation room
 *     socket.on('join_conversation', ({ conversationId }) => {
 *       socket.join(`conversation:${conversationId}`);
 *     });
 *
 *     // Handle message
 *     socket.on('send_message', async (data) => {
 *       const message = await saveMessage(data);
 *       io.to(`conversation:${data.conversationId}`).emit('new_message', message);
 *     });
 *
 *     // Handle typing indicator
 *     socket.on('typing', ({ conversationId, isTyping }) => {
 *       io.to(`conversation:${conversationId}`).emit('user_typing', {
 *         userId: socket.data.userId,
 *         isTyping,
 *       });
 *     });
 *
 *     socket.on('disconnect', () => {
 *       console.log('Client disconnected:', socket.id);
 *     });
 *   });
 *
 *   return io;
 * }
 * ----
 *
 * Usage in app:
 * ----
 * import { io } from 'socket.io-client';
 *
 * const socket = io('http://localhost:3000', {
 *   auth: { token: sessionToken },
 * });
 *
 * socket.emit('send_message', { content, conversationId });
 * socket.on('new_message', (message) => console.log(message));
 * ----
 *
 *
 * Option B: Native WebSocket with ws library
 * ==========================================
 *
 * Installation:
 *   npm install ws
 *
 * Create: server/websocket-server.ts
 * ----
 * import { WebSocketServer } from 'ws';
 *
 * export function startWebSocketServer(port: number) {
 *   const wss = new WebSocketServer({ port });
 *
 *   wss.on('connection', (ws) => {
 *     ws.on('message', async (data) => {
 *       const message = JSON.parse(data);
 *       
 *       switch(message.type) {
 *         case 'message':
 *           const saved = await saveMessage(message.payload);
 *           broadcast({ type: 'new_message', payload: saved });
 *           break;
 *         case 'typing':
 *           broadcast(message);
 *           break;
 *       }
 *     });
 *   });
 *
 *   return wss;
 * }
 * ----
 *
 * Usage in app:
 * ----
 * const ws = new WebSocket('ws://localhost:8080');
 * ws.send(JSON.stringify({ type: 'message', payload: {...} }));
 * ws.onmessage = (event) => handleMessage(JSON.parse(event.data));
 * ----
 *
 *
 * Option C: Third-Party Service (Easier to Deploy)
 * ================================================
 *
 * Services:
 * - Pusher (easiest, commercial)
 * - Ably (more features)
 * - ConvertKit (open source alternative)
 *
 * Example with Pusher:
 *
 * Installation:
 *   npm install pusher pusher-js
 *
 * Backend:
 * ----
 * import Pusher from 'pusher';
 *
 * const pusher = new Pusher({
 *   appId: process.env.PUSHER_APP_ID,
 *   key: process.env.PUSHER_KEY,
 *   secret: process.env.PUSHER_SECRET,
 *   cluster: process.env.PUSHER_CLUSTER,
 * });
 *
 * async function broadcastMessage(conversationId: string, message: any) {
 *   await pusher.trigger(`conversation-${conversationId}`, 'new-message', message);
 * }
 * ----
 *
 * Frontend:
 * ----
 * import Pusher from 'pusher-js';
 *
 * const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
 *   cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
 * });
 *
 * const channel = pusher.subscribe(`conversation-${conversationId}`);
 * channel.bind('new-message', (message) => {
 *   addMessage(message);
 * });
 * ----
 *
 *
 * Option D: Vercel KV with Polling
 * ==============================
 *
 * Installation:
 *   npm vercel env add VERCEL_KV_REST_API_URL
 *   npm vercel env add VERCEL_KV_REST_API_TOKEN
 *
 * Backend:
 * ----
 * import { kv } from '@vercel/kv';
 *
 * export async function POST(req: NextRequest) {
 *   const { conversationId, content } = await req.json();
 *
 *   const message = {
 *     id: crypto.randomUUID(),
 *     content,
 *     timestamp: new Date().toISOString(),
 *   };
 *
 *   await kv.lpush(`messages:${conversationId}`, message);
 *   await kv.publish(`conv:${conversationId}`, JSON.stringify(message));
 *
 *   return Response.json(message);
 * }
 * ----
 *
 * Frontend (polling):
 * ----
 * useEffect(() => {
 *   const interval = setInterval(async () => {
 *     const latest = await fetch(`/api/messages?conversation=${id}`);
 *     const messages = await latest.json();
 *     setMessages(messages);
 *   }, 1000); // Poll every second
 *
 *   return () => clearInterval(interval);
 * }, []);
 * ----
 *
 *
 * RECOMMENDATION
 * ==============
 *
 * For Unify:
 * ✅ Use Socket.IO - Best balance of features, documentation, and developer experience
 *
 * Socket.IO advantages:
 * - Compatible with Next.js
 * - Fallback to polling/long-polling
 * - Built-in rooms (for conversations)
 * - Type-safe with TypeScript
 * - Great documentation
 * - Open source
 *
 * Implementation steps:
 * 1. npm install socket.io socket.io-client
 * 2. Create server/socket-api.ts with Socket.IO setup
 * 3. Create hooks/useSocketIO.ts client hook
 * 4. Update MessagesContext to use Socket.IO
 * 5. Replace useWebSocket hook calls with useSocketIO
 * 6. Test with 2 browsers in same conversation
 *
 */

/**
 * Message Handler Template
 * ========================
 */

async function handleMessage(data: WebSocketMessage, clientInfo: any) {
  const { type, payload } = data;

  switch (type) {
    case 'message':
      // Save to database
      const message = await saveMessageToDb({
        content: payload.content,
        conversationId: payload.conversationId,
        senderId: clientInfo.userId,
        attachments: payload.attachments,
      });

      // Broadcast to all connected clients in conversation
      broadcastToConversation(payload.conversationId, {
        type: 'new_message',
        payload: message,
      });

      return message;

    case 'typing':
      // Broadcast without saving
      broadcastToConversation(payload.conversationId, {
        type: 'user_typing',
        userId: clientInfo.userId,
        isTyping: payload.isTyping,
      });
      return null;

    case 'reaction':
      // Add/remove reaction
      const reaction = await addReactionToDb(payload.messageId, payload.emoji, clientInfo.userId);
      broadcastToConversation(payload.conversationId, {
        type: 'message_reaction',
        payload: reaction,
      });
      return reaction;

    case 'read':
      // Mark message as read
      await markMessageAsRead(payload.messageId, clientInfo.userId);
      broadcastToConversation(payload.conversationId, {
        type: 'message_read',
        messageId: payload.messageId,
        userId: clientInfo.userId,
      });
      return null;

    case 'delete':
      // Delete message
      await deleteMessageFromDb(payload.messageId);
      broadcastToConversation(payload.conversationId, {
        type: 'message_deleted',
        messageId: payload.messageId,
      });
      return null;

    case 'user_online':
      broadcastToConversation(payload.conversationId, {
        type: 'user_online',
        userId: clientInfo.userId,
      });
      return null;

    case 'user_offline':
      broadcastToConversation(payload.conversationId, {
        type: 'user_offline',
        userId: clientInfo.userId,
      });
      return null;

    default:
      console.warn('Unknown message type:', type);
      return null;
  }
}

// Placeholder functions - implement with your DB
async function saveMessageToDb(data: any) {
  // Save to Prisma/DB
  return { id: crypto.randomUUID(), ...data };
}

async function addReactionToDb(messageId: string, emoji: string, userId: string) {
  // Add to DB and return
  return { messageId, emoji, userId };
}

async function markMessageAsRead(messageId: string, userId: string) {
  // Mark in DB
}

async function deleteMessageFromDb(messageId: string) {
  // Delete from DB
}

function broadcastToConversation(conversationId: string, message: WebSocketMessage) {
  const clients = connectedClients.get(conversationId) || [];
  clients.forEach(client => {
    // Send via WebSocket
  });
}

export { handleMessage, connectedClients };
