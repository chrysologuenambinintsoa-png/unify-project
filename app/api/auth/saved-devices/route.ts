import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/auth/saved-devices
// body: { email, deviceName?, userAgent? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, deviceName, userAgent } = body;

    if (!email) {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const record = await (prisma as any).savedDevice.create({
      data: {
        userId: user.id,
        deviceName: deviceName || null,
        userAgent: userAgent || null,
      },
    });

    return NextResponse.json({ success: true, device: record });
  } catch (error) {
    console.error('Error creating saved device:', error);
    return NextResponse.json({ error: 'Failed to create saved device' }, { status: 500 });
  }
}
