// Server: Produce (announce a producer on the server)
// POST /api/live/[roomId]/mediasoup/produce

// @ts-ignore
import { NextRequest, NextResponse } from 'next/server';
import mediaAdapter from '@/lib/mediasoupAdapter';

export async function POST(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { transportId, kind, rtpParameters, appData } = body || {};
    if (!roomId || !transportId || !rtpParameters || !kind) return NextResponse.json({ ok: false, error: 'Missing params' }, { status: 400 });

    await mediaAdapter.init();
    const transport = mediaAdapter.getTransport(roomId, transportId);
    if (!transport) return NextResponse.json({ ok: false, error: 'Transport not found' }, { status: 404 });

    const producer = await transport.produce({ kind, rtpParameters, appData });

    // register producer for room-level listing and cleanup
    try { mediaAdapter.registerProducer(roomId, producer); } catch (e) {}

    return NextResponse.json({ ok: true, producerId: producer.id });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
