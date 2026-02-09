// @ts-ignore
import { NextResponse } from 'next/server';
// @ts-ignore
import { liveRoomsManager } from '@/lib/liveRoomsManager';

// In-memory storage for messages (in production, use a database)
const roomMessages: Map<string, Array<{
  id: string;
  roomId: string;
  participantId: string;
  participantName: string;
  text: string;
  timestamp: number;
}>> = new Map();

/**
 * POST /api/live/[roomId]/comment
 * Send a comment/message in a live room
 * Body: { participantId, participantName, text }
 */
export async function POST(
  request: Request,
  context: any
) {
  const params = context?.params || {};

  try {
    const roomId = params.roomId;
    const body = await request.json();

    if (!roomId) {
      return NextResponse.json(
        { ok: false, error: 'Room ID is required' },
        { status: 400 }
      );
    }

    const { participantId, participantName = 'Guest', text } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Message text is required' },
        { status: 400 }
      );
    }

    // Check if room exists
    const room = liveRoomsManager.getRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { ok: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Create message
    const message = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      participantId: participantId || 'guest',
      participantName: participantName || 'Guest',
      text: text.trim().substring(0, 500), // Limit to 500 chars
      timestamp: Date.now(),
    };

    // Store message
    if (!roomMessages.has(roomId)) {
      roomMessages.set(roomId, []);
    }
    const messages = roomMessages.get(roomId)!;
    messages.push(message);

    // Keep only last 100 messages per room
    if (messages.length > 100) {
      messages.shift();
    }

    return NextResponse.json({
      ok: true,
      message: 'Comment sent successfully',
      comment: message,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/live/[roomId]/comment
 * Get all comments/messages for a live room
 */
export async function GET(
  request: Request,
  context: any
) {
  const params = context?.params || {};
  try {
    const roomId = params.roomId;

    if (!roomId) {
      return NextResponse.json(
        { ok: false, error: 'Room ID is required' },
        { status: 400 }
      );
    }

    // Check if room exists
    const room = liveRoomsManager.getRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { ok: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    const messages = roomMessages.get(roomId) || [];

    return NextResponse.json({
      ok: true,
      roomId,
      count: messages.length,
      messages: messages.slice(-50), // Return last 50 messages
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
