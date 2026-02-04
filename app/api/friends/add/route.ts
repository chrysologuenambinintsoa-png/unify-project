import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/friends/add - Send a friend request (from search)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Prevent self-friend request
    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check for existing friendship
    const existingFriendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          {
            user1Id: session.user.id,
            user2Id: userId,
          },
          {
            user1Id: userId,
            user2Id: session.user.id,
          },
        ],
      },
    });

    if (existingFriendship) {
      if (existingFriendship.status === 'accepted') {
        return NextResponse.json(
          { error: 'Already friends with this user' },
          { status: 400 }
        );
      } else if (existingFriendship.status === 'pending') {
        return NextResponse.json(
          { error: 'Friend request already sent' },
          { status: 400 }
        );
      }
    }

    // Create friendship request (current user is user1)
    const friendship = await prisma.friendship.create({
      data: {
        user1Id: session.user.id,
        user2Id: userId,
        status: 'pending',
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    // Create notification for the recipient
    const requester = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { fullName: true },
    });

    await prisma.notification.create({
      data: {
        userId: userId,
        type: 'friend_request',
        actorId: session.user.id,
        title: `${requester?.fullName || 'Someone'} sent you a friend request`,
        content: `${requester?.fullName || 'Someone'} sent you a friend request`,
        url: `/users/${session.user.id}/profile`, // Direct link to requester's profile
      },
    });

    return NextResponse.json(friendship, { status: 201 });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json(
      { error: 'Failed to send friend request' },
      { status: 500 }
    );
  }
}
