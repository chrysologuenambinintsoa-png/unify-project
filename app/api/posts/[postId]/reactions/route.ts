import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/posts/[postId]/reactions - Get all reactions for a post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Get all reactions grouped by emoji
    const reactions = await prisma.reaction.findMany({
      where: {
        postId: postId,
        commentId: null, // Only reactions on the post itself
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

    // Group reactions by emoji and include count
    const groupedReactions = reactions.reduce((acc, reaction) => {
      const existing = acc.find(r => r.emoji === reaction.emoji);
      if (existing) {
        existing.count += 1;
        existing.users.push(reaction.user);
      } else {
        acc.push({
          emoji: reaction.emoji,
          count: 1,
          users: [reaction.user],
        });
      }
      return acc;
    }, [] as Array<{ emoji: string; count: number; users: any[] }>);

    return NextResponse.json({
      total: reactions.length,
      reactions: groupedReactions,
      allReactions: reactions,
    });
  } catch (error) {
    console.error('Error fetching reactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reactions' },
      { status: 500 }
    );
  }
}

// POST /api/posts/[postId]/reactions - Add or remove a reaction to a post
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
    const body = await request.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if reaction already exists
    const existingReaction = await prisma.reaction.findFirst({
      where: {
        postId: postId,
        userId: session.user.id,
        emoji: emoji,
        commentId: null,
      },
    });

    if (existingReaction) {
      // Remove reaction if it already exists (toggle behavior)
      await prisma.reaction.delete({
        where: { id: existingReaction.id },
      });

      // publish updated counts
      try {
        const counts = await prisma.post.findUnique({
          where: { id: postId },
          select: { _count: { select: { reactions: true, comments: true, likes: true, shares: true } } },
        });
        const { publishPostEvent } = await import('@/lib/postEvents');
        publishPostEvent({ type: 'reaction', payload: { id: postId, _count: counts?._count } });
      } catch (e) {
        console.warn('Failed to publish reaction removed event', e);
      }

      return NextResponse.json({
        message: 'Reaction removed',
        action: 'removed',
      });
    }

    // Create new reaction
    const reaction = await prisma.reaction.create({
      data: {
        emoji,
        postId: postId,
        userId: session.user.id,
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
    });

    try {
      const counts = await prisma.post.findUnique({
        where: { id: postId },
        select: { _count: { select: { reactions: true, comments: true, likes: true, shares: true } } },
      });
      const { publishPostEvent } = await import('@/lib/postEvents');
      publishPostEvent({ type: 'reaction', payload: { id: postId, _count: counts?._count } });
    } catch (e) {
      console.warn('Failed to publish reaction added event', e);
    }

    return NextResponse.json(
      {
        message: 'Reaction added',
        action: 'added',
        reaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding reaction:', error);
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[postId]/reactions - Remove a reaction from a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;
    const body = await request.json();
    const { emoji } = body;

    if (!emoji) {
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }

    const reaction = await prisma.reaction.findFirst({
      where: {
        postId: postId,
        userId: session.user.id,
        emoji: emoji,
        commentId: null,
      },
    });

    if (!reaction) {
      return NextResponse.json(
        { error: 'Reaction not found' },
        { status: 404 }
      );
    }

    await prisma.reaction.delete({
      where: { id: reaction.id },
    });

    return NextResponse.json({ message: 'Reaction deleted' });
  } catch (error) {
    console.error('Error deleting reaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete reaction' },
      { status: 500 }
    );
  }
}
