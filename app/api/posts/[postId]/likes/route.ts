import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/posts/[postId]/likes - Like or unlike a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;

    // Check if already liked
    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId: postId,
          userId: session.user.id,
        },
      },
    });

    if (existingLike) {
      // Unlike
      await prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });

      return NextResponse.json({ liked: false });
    } else {
      // Like
      await prisma.like.create({
        data: {
          postId: postId,
          userId: session.user.id,
        },
      });

      return NextResponse.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle like' },
      { status: 500 }
    );
  }
}

// GET /api/posts/[postId]/likes - Get likes for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const likes = await prisma.like.findMany({
      where: {
        postId: postId,
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
    });

    return NextResponse.json(likes);
  } catch (error) {
    console.error('Error fetching likes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch likes' },
      { status: 500 }
    );
  }
}