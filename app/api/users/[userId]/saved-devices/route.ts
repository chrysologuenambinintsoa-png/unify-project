import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, context: any) {
  try {
    const session = await getServerSession(authOptions);
    const userId = context?.params?.userId;
    if (!session || session.user?.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const devices = await (prisma as any).savedDevice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { id: true, deviceName: true, userAgent: true, ipAddress: true, createdAt: true },
    });

    return NextResponse.json({ devices });
  } catch (error) {
    console.error('Error fetching saved devices:', error);
    return NextResponse.json({ error: 'Failed to fetch saved devices' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, context: any) {
  try {
    const session = await getServerSession(authOptions);
    const userId = context?.params?.userId;
    if (!session || session.user?.id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const deviceId = url.searchParams.get('deviceId');
    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    await (prisma as any).savedDevice.deleteMany({ where: { id: deviceId, userId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting saved device:', error);
    return NextResponse.json({ error: 'Failed to delete saved device' }, { status: 500 });
  }
}
