import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/feed - Get user feed (following posts)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get posts: include user's own posts, friends' posts (accepted friendships), and public posts
    // so that actions like avatar/cover updates (which create posts) appear in the home feed.
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: session.user.id, status: 'accepted' },
          { user2Id: session.user.id, status: 'accepted' },
        ],
      },
      select: { user1Id: true, user2Id: true },
    });

    const friendIds = friendships
      .map((f: any) => (f.user1Id === session.user.id ? f.user2Id : f.user1Id))
      .filter(Boolean);

    const baseOr: any[] = [
      { userId: session.user.id },
      { isPublic: true },
    ];

    if (friendIds.length) {
      baseOr.push({ userId: { in: friendIds } });
    }

    const whereClause: any = {
      isDeleted: false,
      AND: [{ OR: baseOr }],
    };

    const posts = await prisma.post.findMany({
      where: whereClause,
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
        media: true,
        comments: {
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
          take: 3,
        },
        likes: {
          select: {
            userId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feed' },
      { status: 500 }
    );
  }
}
