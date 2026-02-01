import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/explore - Get trending posts and suggested users
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get trending posts (posts with most likes in the last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingPosts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            isVerified: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            shares: true,
          },
        },
      },
      orderBy: [
        {
          likes: {
            _count: 'desc',
          },
        },
        {
          createdAt: 'desc',
        },
      ],
      take: 20,
    });

    // Get suggested users (users not friends with current user)
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: session.user.id, status: 'accepted' },
          { user2Id: session.user.id, status: 'accepted' },
        ],
      },
      select: {
        user1Id: true,
        user2Id: true,
      },
    });

    const friendIds = friendships.flatMap(f => [f.user1Id, f.user2Id]).filter(id => id !== session.user.id);

    const suggestedUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: [...friendIds, session.user.id],
        },
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
        bio: true,
        _count: {
          select: {
            friends1: true,
            friends2: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 15,
    });

    // Map suggested users to include follower count
    const mappedSuggestedUsers = suggestedUsers.map(user => ({
      ...user,
      _count: {
        followers: user._count.friends1 + user._count.friends2,
      },
    }));

    return NextResponse.json({
      trendingPosts,
      suggestedUsers: mappedSuggestedUsers,
    });
  } catch (error) {
    console.error('Error fetching explore data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch explore data' },
      { status: 500 }
    );
  }
}