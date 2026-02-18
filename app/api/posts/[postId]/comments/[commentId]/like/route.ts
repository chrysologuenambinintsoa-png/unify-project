import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/posts/[postId]/comments/[commentId]/like - Toggle like on comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; commentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId, commentId } = await params;

    // Verify comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, userId: true, postId: true },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (comment.postId !== postId) {
      return NextResponse.json({ error: 'Comment does not belong to this post' }, { status: 400 });
    }

    // Check if user already liked
    const existingLike = await prisma.commentReaction.findFirst({
      where: {
        commentId: commentId,
        userId: session.user.id,
        emoji: 'like',
      },
    });

    if (existingLike) {
      // Remove like (toggle)
      await prisma.commentReaction.delete({
        where: { id: existingLike.id },
      });

      return NextResponse.json({
        message: 'Like removed',
        action: 'removed',
        liked: false,
      });
    }

    // Add like
    const reaction = await prisma.commentReaction.create({
      data: {
        emoji: 'like',
        commentId: commentId,
        userId: session.user.id,
      },
    });

    return NextResponse.json(
      {
        message: 'Comment liked',
        action: 'added',
        liked: true,
        reaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error toggling comment like:', error);
    return NextResponse.json(
      { error: 'Failed to toggle comment like' },
      { status: 500 }
    );
  }
}
