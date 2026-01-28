import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/friends - Get friends and friend requests
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';

    let friends: any[] = [];

    if (type === 'all' || type === 'accepted') {
      // Get accepted friendships
      const acceptedFriends = await prisma.friendship.findMany({
        where: {
          OR: [
            { user1Id: session.user.id },
            { user2Id: session.user.id },
          ],
          status: 'accepted',
        },
        include: {
          user1: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              bio: true,
            },
          },
          user2: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              bio: true,
            },
          },
        },
      });

      friends = acceptedFriends.map((f) => ({
        ...f,
        friend: f.user1Id === session.user.id ? f.user2 : f.user1,
      }));
    }

    if (type === 'all' || type === 'pending') {
      // Get pending friend requests
      const pendingRequests = await prisma.friendship.findMany({
        where: {
          user2Id: session.user.id,
          status: 'pending',
        },
        include: {
          user1: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              bio: true,
            },
          },
          user2: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              bio: true,
            },
          },
        },
      });

      friends = [
        ...friends,
        ...pendingRequests.map((f) => ({
          ...f,
          friend: f.user1,
        })),
      ];
    }

    if (type === 'suggestions') {
      // Get friend suggestions (users not already friends)
      const existingFriendIds = await prisma.friendship.findMany({
        where: {
          OR: [
            { user1Id: session.user.id },
            { user2Id: session.user.id },
          ],
        },
        select: {
          user1Id: true,
          user2Id: true,
        },
      });

      const excludeIds = [
        session.user.id,
        ...existingFriendIds.map((f) => f.user1Id),
        ...existingFriendIds.map((f) => f.user2Id),
      ];

      const suggestions = await prisma.user.findMany({
        where: {
          id: {
            notIn: excludeIds,
          },
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          bio: true,
        },
        take: 10,
      });

      return NextResponse.json({ suggestions });
    }

    return NextResponse.json({ friends });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}

// POST /api/friends - Send friend request
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

    if (userId === session.user.id) {
      return NextResponse.json(
        { error: 'Cannot send friend request to yourself' },
        { status: 400 }
      );
    }

    // Check if friendship already exists
    const existingFriendship = await prisma.friendship.findUnique({
      where: {
        user1Id_user2Id: {
          user1Id: session.user.id,
          user2Id: userId,
        },
      },
    });

    if (existingFriendship) {
      return NextResponse.json(
        { error: 'Friendship already exists' },
        { status: 400 }
      );
    }

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

    return NextResponse.json(friendship, { status: 201 });
  } catch (error) {
    console.error('Error creating friendship:', error);
    return NextResponse.json(
      { error: 'Failed to create friendship' },
      { status: 500 }
    );
  }
}

// PATCH /api/friends - Update friendship status (accept, decline, cancel)
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { friendshipId, status } = body;

    if (!friendshipId || !status) {
      return NextResponse.json(
        { error: 'Friendship ID and status are required' },
        { status: 400 }
      );
    }

    const friendship = await prisma.friendship.update({
      where: {
        id: friendshipId,
      },
      data: {
        status,
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

    return NextResponse.json(friendship);
  } catch (error) {
    console.error('Error updating friendship:', error);
    return NextResponse.json(
      { error: 'Failed to update friendship' },
      { status: 500 }
    );
  }
}

// DELETE /api/friends - Remove friend or cancel request
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const friendshipId = searchParams.get('friendshipId');

    if (!friendshipId) {
      return NextResponse.json(
        { error: 'Friendship ID is required' },
        { status: 400 }
      );
    }

    await prisma.friendship.delete({
      where: {
        id: friendshipId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting friendship:', error);
    return NextResponse.json(
      { error: 'Failed to delete friendship' },
      { status: 500 }
    );
  }
}