// Server: List current producers on the router
// GET /api/live/[roomId]/mediasoup/producers

// @ts-ignore
import { NextResponse } from 'next/server';
import mediaAdapter from '@/lib/mediasoupAdapter';

export async function GET(_request: Request, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    if (!roomId) return NextResponse.json({ ok: false, error: 'roomId required' }, { status: 400 });

    await mediaAdapter.init();
    // prefer adapter-managed producers map
    const producers = mediaAdapter.listProducers(roomId);
    return NextResponse.json({ ok: true, producers });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
