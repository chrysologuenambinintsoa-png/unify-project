// Server: Create consumer for a given producer
// POST /api/live/[roomId]/mediasoup/consume

// @ts-ignore
import { NextRequest, NextResponse } from 'next/server';
import mediaAdapter from '@/lib/mediasoupAdapter';

export async function POST(request: NextRequest, { params }: { params: Promise<{ roomId: string }> }) {
  try {
    const { roomId } = await params;
    const body = await request.json();
    const { transportId, producerId, rtpCapabilities } = body || {};
    if (!roomId || !transportId || !producerId || !rtpCapabilities) return NextResponse.json({ ok: false, error: 'Missing params' }, { status: 400 });

    await mediaAdapter.init();
    const router = await mediaAdapter.getRouter(roomId);
    if (!(router as any).canConsume) return NextResponse.json({ ok: false, error: 'Router cannot consume' }, { status: 500 });

    const transport = mediaAdapter.getTransport(roomId, transportId);
    if (!transport) return NextResponse.json({ ok: false, error: 'Transport not found' }, { status: 404 });

    const canConsume = (router as any).canConsume({ producerId, rtpCapabilities });
    if (!canConsume) return NextResponse.json({ ok: false, error: 'Cannot consume' }, { status: 400 });

    const consumer = await transport.consume({ producerId, rtpCapabilities, paused: false });

    const data = {
      id: consumer.id,
      producerId: consumer.producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };

    return NextResponse.json({ ok: true, consumer: data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
