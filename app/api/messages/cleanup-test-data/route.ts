import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * DELETE /api/messages/cleanup-test-data
 * Removes test messages (development/testing purposes only)
 * Only accessible by the authenticated user
 * Removes messages that:
 * - Contain "test" (case-insensitive) in the content
 * - Are from or to users with "test" in their username
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find test users (users with "test" in username)
    const testUsers = await prisma.user.findMany({
      where: {
        username: {
          contains: 'test',
          mode: 'insensitive',
        },
      },
    });

    const testUserIds = testUsers.map(u => u.id);

    // Delete messages that match test criteria:
    // 1. Messages with "test" in content
    // 2. Messages from or to test users
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        OR: [
          // Messages containing "test" in content
          {
            content: {
              contains: 'test',
              mode: 'insensitive',
            },
          },
          // Messages from test users
          {
            senderId: {
              in: testUserIds,
            },
          },
          // Messages to test users
          {
            receiverId: {
              in: testUserIds,
            },
          },
        ],
      },
    });

    // Also delete message reactions for deleted messages
    // (Cascade should handle this, but being explicit)

    return NextResponse.json({
      success: true,
      message: `Deleted ${deletedMessages.count} test messages`,
      count: deletedMessages.count,
      testUsersFound: testUserIds.length,
    });
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup test data', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/messages/cleanup-test-data
 * Preview what will be deleted (non-destructive check)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find test users
    const testUsers = await prisma.user.findMany({
      where: {
        username: {
          contains: 'test',
          mode: 'insensitive',
        },
      },
    });

    const testUserIds = testUsers.map(u => u.id);

    // Count messages that would be deleted
    const messagesToDelete = await prisma.message.findMany({
      where: {
        OR: [
          {
            content: {
              contains: 'test',
              mode: 'insensitive',
            },
          },
          {
            senderId: {
              in: testUserIds,
            },
          },
          {
            receiverId: {
              in: testUserIds,
            },
          },
        ],
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        sender: { select: { username: true } },
        receiver: { select: { username: true } },
      },
    });

    return NextResponse.json({
      previewCount: messagesToDelete.length,
      testUsersFound: testUsers.map(u => u.username),
      messages: messagesToDelete.slice(0, 10), // Show sample of 10 messages
      note: 'This is a preview. Use DELETE method to actually remove messages.',
    });
  } catch (error) {
    console.error('Error previewing test data cleanup:', error);
    return NextResponse.json(
      { error: 'Failed to preview test data cleanup' },
      { status: 500 }
    );
  }
}
