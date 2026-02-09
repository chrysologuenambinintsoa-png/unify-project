// @ts-ignore
import { NextResponse } from 'next/server';
// @ts-ignore
import { liveRoomsManager } from '@/lib/liveRoomsManager';

// In-memory storage for reactions
const roomReactions: Map<string, Array<{
  id: string;
  roomId: string;
  participantId: string;
  participantName: string;
  emoji: string;
  timestamp: number;
}>> = new Map();

// Valid emoji reactions
const VALID_REACTIONS = ['👍', '❤️', '😂', '😍', '🔥', '👏', '⚡', '🎉', '😱', '💯'];

/**
 * POST /api/live/[roomId]/reaction
 * Send a reaction emoji in a live room
 * Body: { participantId, participantName, emoji }
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

    const { participantId, participantName = 'Guest', emoji } = body;

    if (!emoji) {
      return NextResponse.json(
        { ok: false, error: 'Emoji is required' },
        { status: 400 }
      );
    }

    if (!VALID_REACTIONS.includes(emoji)) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Invalid emoji. Allowed: ' + VALID_REACTIONS.join(' '),
        },
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

    // Create reaction
    const reaction = {
      id: `reac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      roomId,
      participantId: participantId || 'guest',
      participantName: participantName || 'Guest',
      emoji,
      timestamp: Date.now(),
    };

    // Store reaction
    if (!roomReactions.has(roomId)) {
      roomReactions.set(roomId, []);
    }
    const reactions = roomReactions.get(roomId)!;
    reactions.push(reaction);

    // Keep only last 1000 reactions per room
    if (reactions.length > 1000) {
      reactions.shift();
    }

    // Get reaction count for emoji
    const emojiCount = reactions.filter((r) => r.emoji === emoji).length;

    return NextResponse.json({
      ok: true,
      message: 'Reaction sent successfully',
      reaction,
      stats: {
        emoji,
        count: emojiCount,
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
 * GET /api/live/[roomId]/reaction
 * Get reaction statistics for a live room
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

    const reactions = roomReactions.get(roomId) || [];

    // Aggregate reactions by emoji
    const stats: Record<string, number> = {};
    for (const reaction of reactions) {
      stats[reaction.emoji] = (stats[reaction.emoji] || 0) + 1;
    }

    // Sort by count descending
    const sortedStats = Object.entries(stats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10); // Top 10 reactions

    return NextResponse.json({
      ok: true,
      roomId,
      totalReactions: reactions.length,
      recentReactions: reactions.slice(-20), // Last 20 reactions
      stats: Object.fromEntries(sortedStats),
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
