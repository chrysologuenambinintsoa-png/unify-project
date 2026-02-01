import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { publish } from '@/app/api/realtime/broadcast';

// GET /api/stories/[storyId]/reactions - Get all reactions of a story
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;

    // Verify story exists
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Get all reactions for this story
    const reactions = await prisma.storyReaction.findMany({
      where: {
        storyId: storyId,
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
    console.error('Error fetching story reactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reactions' },
      { status: 500 }
    );
  }
}

// POST /api/stories/[storyId]/reactions - Add or remove a reaction to a story
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storyId } = await params;
    
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }
    const { emoji } = body;

    if (!emoji || emoji.trim() === '') {
      console.error('Emoji is missing or empty:', { emoji });
      return NextResponse.json(
        { error: 'Emoji is required' },
        { status: 400 }
      );
    }

    // Verify story exists
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Check if story is still valid
    if (story.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Story has expired' },
        { status: 410 }
      );
    }

    // Check if reaction already exists
    const existingReaction = await prisma.storyReaction.findUnique({
      where: {
        storyId_userId: {
          storyId: storyId,
          userId: session.user.id,
        },
      },
    });

    if (existingReaction) {
      // If same emoji, remove it (toggle). If different emoji, update it
      if (existingReaction.emoji === emoji) {
        // Remove reaction (toggle)
        await prisma.storyReaction.delete({
          where: {
            storyId_userId: {
              storyId: storyId,
              userId: session.user.id,
            },
          },
        });

        // publish removal
        try { publish('story-reaction', { storyId, action: 'removed', userId: session.user.id, emoji: existingReaction.emoji }); } catch (e) {}

        return NextResponse.json({
          message: 'Reaction removed',
          action: 'removed',
        });
      } else {
        // Update to different emoji
        const updatedReaction = await prisma.storyReaction.update({
          where: {
            storyId_userId: {
              storyId: storyId,
              userId: session.user.id,
            },
          },
          data: {
            emoji: emoji,
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

        // create notification for story owner about updated reaction
        try {
          await prisma.notification.create({
            data: {
              type: 'reaction',
              title: 'Nouvelle réaction',
              content: `${updatedReaction.user.fullName || updatedReaction.user.username} a réagi ${emoji}`,
              url: `/stories/${storyId}`,
              userId: story.userId,
              actorId: session.user.id,
            },
          });
        } catch (notifErr) {
          console.error('Failed to create notification for reaction update:', notifErr);
        }

        // publish update
        try { publish('story-reaction', { storyId, action: 'updated', reaction: updatedReaction }); } catch (e) {}

        return NextResponse.json(
          {
            message: 'Reaction updated',
            action: 'updated',
            reaction: updatedReaction,
          },
          { status: 200 }
        );
      }
    }

    // Create new reaction
    const reaction = await prisma.storyReaction.create({
      data: {
        emoji,
        storyId: storyId,
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

    // create notification for story owner about new reaction
    try {
      await prisma.notification.create({
        data: {
          type: 'reaction',
          title: 'Nouvelle réaction',
          content: `${reaction.user.fullName || reaction.user.username} a réagi ${emoji}`,
          url: `/stories/${storyId}`,
          userId: story.userId,
          actorId: session.user.id,
        },
      });
    } catch (notifErr) {
      console.error('Failed to create notification for reaction create:', notifErr);
    }

    // publish addition
    try { publish('story-reaction', { storyId, action: 'added', reaction }); } catch (e) {}

    return NextResponse.json(
      {
        message: 'Reaction added',
        action: 'added',
        reaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error adding story reaction:', error);
    return NextResponse.json(
      { error: 'Failed to add reaction' },
      { status: 500 }
    );
  }
}

// DELETE /api/stories/[storyId]/reactions - Remove a reaction from a story
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storyId } = await params;

    // Verify story exists
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Delete reaction
    const deleted = await prisma.storyReaction.deleteMany({
      where: {
        storyId: storyId,
        userId: session.user.id,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: 'Reaction not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: 'Reaction deleted' });
  } catch (error) {
    console.error('Error deleting story reaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete reaction' },
      { status: 500 }
    );
  }
}
