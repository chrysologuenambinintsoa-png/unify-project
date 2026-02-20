import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: blockedId } = await params;
    const currentUserId = session.user.id;

    if (blockedId === currentUserId) {
      return NextResponse.json(
        { error: 'You cannot block yourself' },
        { status: 400 }
      );
    }

    // Check if blocked user exists
    const blockedUser = await prisma.user.findUnique({
      where: { id: blockedId },
      select: { id: true, fullName: true },
    });

    if (!blockedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Create or update block entry
    const blocked = await prisma.blockedUser.upsert({
      where: {
        userId_blockedId: {
          userId: currentUserId,
          blockedId,
        },
      },
      update: {}, // If already exists, just return it
      create: {
        userId: currentUserId,
        blockedId,
      },
      include: {
        blocked: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: `${blockedUser.fullName} has been blocked`,
        blocked,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error blocking user:', error);
    return NextResponse.json(
      { error: 'Failed to block user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId: blockedId } = await params;
    const currentUserId = session.user.id;

    // Unblock user
    await prisma.blockedUser.deleteMany({
      where: {
        userId: currentUserId,
        blockedId,
      },
    });

    return NextResponse.json(
      { success: true, message: 'User has been unblocked' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error unblocking user:', error);
    return NextResponse.json(
      { error: 'Failed to unblock user' },
      { status: 500 }
    );
  }
}
