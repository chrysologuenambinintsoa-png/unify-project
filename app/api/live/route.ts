import { NextResponse } from 'next/server';
import { liveRoomsManager } from '@/lib/liveRoomsManager';

export async function GET() {
  try {
    const rooms = liveRoomsManager.listRooms();
    return NextResponse.json({ ok: true, rooms });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const id = body.id || `room_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const title = body.title || body.name || 'Live Room';
    const hostId = body.hostId || null;
    const room = liveRoomsManager.createRoom({ id, title, hostId });
    return NextResponse.json({ ok: true, room: { id: room.id, title: room.title } }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
