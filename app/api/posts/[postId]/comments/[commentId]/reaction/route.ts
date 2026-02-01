import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/posts/[postId]/comments/[commentId]/reaction - Add a reaction to a comment
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
    const body = await request.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }

    // Get or create reaction
    const reaction = await prisma.commentReaction.upsert({
      where: {
        userId_commentId: {
          userId: session.user.id,
          commentId: commentId,
        },
      },
      update: {
        emoji,
      },
      create: {
        emoji,
        userId: session.user.id,
        commentId: commentId,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(reaction, { status: 201 });
  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}
