import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/[userId]/posts - Get user posts
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    const session = await getServerSession(authOptions);
    const requesterId = session?.user?.id || null;

    // Determine if requester is friend of the profile owner
    let isFriend = false;
    if (requesterId && requesterId !== userId) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: requesterId, user2Id: userId },
            { user1Id: userId, user2Id: requesterId },
          ],
          status: 'accepted',
        },
      });
      isFriend = !!friendship;
    }

    // Build visibility-aware where clause:
    // - Owner: see all their non-deleted posts
    // - Friend: see owner's posts (including non-public)
    // - Other / anonymous: see only posts where isPublic = true
    const baseWhere: any = { userId, isDeleted: false };
    if (requesterId && requesterId === userId) {
      // owner: no extra filter
    } else if (isFriend) {
      // friend: no extra filter
    } else {
      // not friend or anonymous: only public posts
      baseWhere.isPublic = true;
    }

    const posts = await prisma.post.findMany({
      where: baseWhere,
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
    console.error('Error fetching user posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}
