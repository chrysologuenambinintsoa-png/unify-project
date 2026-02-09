// @ts-ignore
import { NextResponse } from 'next/server';
// @ts-ignore
import { liveRoomsManager } from '@/lib/liveRoomsManager';

/**
 * GET /api/live/[roomId]/participants
 * Get all participants in a live room
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

    const room = liveRoomsManager.getRoom(roomId);
    if (!room) {
      return NextResponse.json(
        { ok: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    const participants = liveRoomsManager.getParticipants(roomId);
    return NextResponse.json({
      ok: true,
      roomId,
      count: participants.length,
      participants,
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
