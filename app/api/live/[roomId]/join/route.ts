// @ts-ignore
import { NextResponse } from 'next/server';
// @ts-ignore
import { liveRoomsManager } from '@/lib/liveRoomsManager';

/**
 * POST /api/live/[roomId]/join
 * Join a live room
 * Body: { participantId, name, role }
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

    const { participantId, name = 'Guest', role = 'participant' } = body;

    // Check if room exists
    const room = liveRoomsManager.getRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { ok: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Generate a unique socket-like identifier for this participant
    const socketId = `${roomId}_${participantId}_${Date.now()}`;

    // Join the room (in real usage, socket would be the actual WebSocket connection)
    // For REST API, we'll use the socketId as a reference
    const participant = {
      id: participantId || `guest_${Date.now()}`,
      name: name || 'Guest',
      role: role || 'participant',
    };

    const joinResult = liveRoomsManager.joinRoom(roomId, socketId, participant);

    if (!joinResult) {
      return NextResponse.json(
        { ok: false, error: 'Failed to join room' },
        { status: 500 }
      );
    }

    const participants = liveRoomsManager.getParticipants(roomId);

    return NextResponse.json({
      ok: true,
      message: `${participant.name} joined the room`,
      roomId,
      socketId, // Client can use this to track their connection
      participant,
      totalParticipants: participants.length,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/live/[roomId]/join
 * Leave a live room
 * Body: { socketId }
 */
export async function DELETE(
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

    const { socketId } = body;
    if (!socketId) {
      return NextResponse.json(
        { ok: false, error: 'Socket ID is required' },
        { status: 400 }
      );
    }

    const room = liveRoomsManager.getRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { ok: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    // Leave room
    liveRoomsManager.leaveRoom(roomId, socketId);

    const participants = liveRoomsManager.getParticipants(roomId);

    return NextResponse.json({
      ok: true,
      message: 'Successfully left the room',
      roomId,
      totalParticipants: participants.length,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
