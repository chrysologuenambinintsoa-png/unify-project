import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/posts/[postId]/share - Share a post
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await context.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Create a shared post
    const sharedPost = await prisma.post.create({
      data: {
        content: `${session.user.username} shared a post`,
        userId: session.user.id,
        sharedPostId: postId,
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
        sharedPost: {
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
        },
      },
    });

    return NextResponse.json(sharedPost, { status: 201 });
  } catch (error) {
    console.error('Error sharing post:', error);
    return NextResponse.json(
      { error: 'Failed to share post' },
      { status: 500 }
    );
  }
}
