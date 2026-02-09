// Server: Connect client's transport (provide dtls parameters)
// POST /api/live/[roomId]/mediasoup/connect-transport

// @ts-ignore
import { NextRequest, NextResponse } from 'next/server';
import mediaAdapter from '@/lib/mediasoupAdapter';

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const roomId = params.roomId;
    const body = await request.json();
    const { transportId, dtlsParameters } = body || {};
    if (!roomId || !transportId || !dtlsParameters) return NextResponse.json({ ok: false, error: 'Missing params' }, { status: 400 });

    await mediaAdapter.init();
    const transport = mediaAdapter.getTransport(roomId, transportId);
    if (!transport) return NextResponse.json({ ok: false, error: 'Transport not found' }, { status: 404 });

    await transport.connect({ dtlsParameters });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
