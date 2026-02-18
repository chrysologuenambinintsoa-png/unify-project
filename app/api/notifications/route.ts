import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/notifications - Get notifications for current user
export async function GET(request: NextRequest) {
  let session: any = null;
  
  try {
    session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.warn('No session found for notifications request');
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    // Transform to match frontend expectations
    const transformedNotifications = notifications.map((notification) => ({
      id: notification.id,
      type: notification.type,
      user: notification.user,
      content: notification.content,
      url: notification.url || null,
      time: notification.createdAt.toISOString(),
      read: notification.isRead,
    }));

    // Count unread notifications
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    return NextResponse.json({
      notifications: transformedNotifications,
      unreadCount,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const isDbError = errorMessage.toLowerCase().includes('database') || 
                      errorMessage.toLowerCase().includes('connection') ||
                      errorMessage.toLowerCase().includes('timeout') ||
                      errorMessage.toLowerCase().includes('econnrefused') ||
                      errorMessage.toLowerCase().includes('enotfound');

    console.error('Error fetching notifications:', {
      error: errorMessage,
      isDatabaseError: isDbError,
      timestamp: new Date().toISOString(),
      userId: session?.user?.id,
      stack: error instanceof Error ? error.stack : undefined,
    });

    // Return 503 for DB errors (client should retry)
    // Return 500 for other errors
    return NextResponse.json(
      { 
        error: isDbError 
          ? 'Database connection temporarily unavailable - please try again shortly' 
          : `Failed to fetch notifications: ${errorMessage}`,
        isRetryable: isDbError,
      },
      { status: isDbError ? 503 : 500 }
    );
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request: NextRequest) {
  let session: any = null;
  try {
    session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, all } = body;

    if (all) {
      // Mark all as read
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          isRead: false,
        },
        data: {
          isRead: true,
        },
      });
    } else if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      await prisma.notification.updateMany({
        where: {
          id: {
            in: notificationIds,
          },
        },
        data: {
          isRead: true,
        },
      });
    }

    // Return updated unread count
    const unreadCount = await prisma.notification.count({
      where: {
        userId: session.user.id,
        isRead: false,
      },
    });

    return NextResponse.json({ 
      success: true,
      unreadCount 
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    const isDbError = errorMessage.toLowerCase().includes('database') || 
                      errorMessage.toLowerCase().includes('connection') ||
                      errorMessage.toLowerCase().includes('timeout') ||
                      errorMessage.toLowerCase().includes('econnrefused') ||
                      errorMessage.toLowerCase().includes('enotfound');

    console.error('Error updating notifications:', {
      error: errorMessage,
      isDatabaseError: isDbError,
      timestamp: new Date().toISOString(),
      userId: session?.user?.id,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { 
        error: isDbError 
          ? 'Database connection temporarily unavailable - please try again shortly' 
          : `Failed to update notifications: ${errorMessage}`,
        isRetryable: isDbError,
      },
      { status: isDbError ? 503 : 500 }
    );
  }
}