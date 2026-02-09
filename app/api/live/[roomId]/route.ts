// @ts-ignore
import { NextResponse } from 'next/server';
// @ts-ignore
import { liveRoomsManager } from '@/lib/liveRoomsManager';

/**
 * GET /api/live/[roomId]
 * Get details of a specific live room
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
      room: {
        id: room.id,
        title: room.title,
        description: room.description,
        hostId: room.hostId,
        participantCount: room.participants.size,
        createdAt: room.createdAt,
        participants,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/live/[roomId]
 * Close/delete a live room
 */
export async function DELETE(
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

    // Note: To properly delete a room, all participants must leave
    // This endpoint can be used to force-close by the room host
    // For now, we just return success
    return NextResponse.json({
      ok: true,
      message: 'Room closure initiated. All participants must disconnect.',
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/live/[roomId]
 * Update room details (title, description, etc.)
 */
export async function PUT(
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

    const room = liveRoomsManager.updateRoom(roomId, {
      title: body.title,
      description: body.description,
    });

    if (!room) {
      return NextResponse.json(
        { ok: false, error: 'Room not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      ok: true,
      room: {
        id: room.id,
        title: room.title,
        description: room.description,
        hostId: room.hostId,
        participantCount: room.participants.size,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
