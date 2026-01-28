import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/unread-counts - Get unread counts for notifications and messages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Count unread notifications
    const unreadNotifications = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    // Count unread messages (messages from others that haven't been read)
    const unreadMessages = await prisma.message.count({
      where: {
        receiverId: session.user.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      notifications: unreadNotifications,
      messages: unreadMessages,
    });
  } catch (error) {
    console.error('Error fetching unread counts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch unread counts' },
      { status: 500 }
    );
  }
}