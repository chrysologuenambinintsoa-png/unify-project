import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/unread-counts - Get unread counts for notifications and messages
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({
        notifications: 0,
        messages: 0,
      });
    }

    try {
      // Count unread notifications with timeout
      const unreadNotifications = await Promise.race([
        prisma.notification.count({
          where: {
            userId: session.user.id,
            isRead: false,
          },
        }),
        new Promise<number>((_, reject) =>
          setTimeout(() => reject(new Error('Notifications query timeout')), 15000)
        ),
      ]).catch((err) => {
        console.warn('Error counting notifications:', err?.message);
        return 0;
      });

      // Count unread messages with timeout
      const unreadMessages = await Promise.race([
        prisma.message.count({
          where: {
            receiverId: session.user.id,
            isRead: false,
          },
        }),
        new Promise<number>((_, reject) =>
          setTimeout(() => reject(new Error('Messages query timeout')), 15000)
        ),
      ]).catch((err) => {
        console.warn('Error counting messages:', err?.message);
        return 0;
      });

      return NextResponse.json({
        notifications: unreadNotifications || 0,
        messages: unreadMessages || 0,
      });
    } catch (dbError) {
      console.warn('Database error in unread-counts:', dbError);
      // Return 0 counts if database is unavailable
      return NextResponse.json({
        notifications: 0,
        messages: 0,
      });
    }
  } catch (error) {
    console.error('Error in unread-counts API:', error);
    return NextResponse.json({
      notifications: 0,
      messages: 0,
    });
  }
}