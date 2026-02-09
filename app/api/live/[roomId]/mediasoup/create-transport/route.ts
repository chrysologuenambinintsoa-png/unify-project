// Server: Create a WebRTC transport for the client
// POST /api/live/[roomId]/mediasoup/create-transport
// returns { id, iceParameters, iceCandidates, dtlsParameters }

// @ts-ignore
import { NextRequest, NextResponse } from 'next/server';
import mediaAdapter from '@/lib/mediasoupAdapter';

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  try {
    const roomId = params.roomId;
    if (!roomId) return NextResponse.json({ ok: false, error: 'roomId required' }, { status: 400 });

    await mediaAdapter.init();
    const transport = await mediaAdapter.createWebRtcTransport(roomId);

    // Store transport meta on router for lookup if needed
    // export the params needed by client to set up transport
    const router = await mediaAdapter.getRouter(roomId);
    const data = {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      routerRtpCapabilities: router.rtpCapabilities,
    };

    return NextResponse.json({ ok: true, transport: data });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
