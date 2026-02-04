import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/polls/[pollId]/vote - Vote on poll option
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pollId } = await params;
    const body = await request.json();
    const { optionIds } = body; // Array for multiple choice or single-item array

    if (!optionIds || !Array.isArray(optionIds)) {
      return NextResponse.json(
        { error: 'optionIds array required' },
        { status: 400 }
      );
    }

    // Check if poll exists and is active
    const pagePoll = await (prisma as any).pagePoll.findUnique({
      where: { id: pollId },
    });

    const groupPoll = await (prisma as any).groupPoll.findUnique({
      where: { id: pollId },
    });

    const poll = pagePoll || groupPoll;

    if (!poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    if (poll.status !== 'active') {
      return NextResponse.json(
        { error: 'Poll is closed' },
        { status: 400 }
      );
    }

    // Remove previous votes if single choice
    if (!poll.allowMultiple) {
      await (prisma as any).pollVote.deleteMany({
        where: {
          userId: session.user.id,
          option: {
            OR: [
              { pagePoolId: pagePoll?.id || undefined },
              { groupPoolId: groupPoll?.id || undefined },
            ],
          },
        },
      });
    }

    // Create new votes
    const votes = await Promise.all(
      optionIds.map((optionId: string) =>
        (prisma as any).pollVote.create({
          data: {
            optionId,
            userId: session.user.id,
            pagePoolId: pagePoll?.id || undefined,
            groupPoolId: groupPoll?.id || undefined,
          },
        })
      )
    );

    // Update vote counts
    await Promise.all(
      optionIds.map((optionId: string) =>
        (prisma as any).pollOption.update({
          where: { id: optionId },
          data: { voteCount: { increment: 1 } },
        })
      )
    );

    return NextResponse.json(votes, { status: 201 });
  } catch (error) {
    console.error('Error voting on poll:', error);
    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 }
    );
  }
}

// POST /api/polls/[pollId]/close - Close poll (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pollId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pollId } = await params;

    // Check permissions
    const pagePoll = await (prisma as any).pagePoll.findUnique({
      where: { id: pollId },
    });

    if (pagePoll) {
      const isAdmin = await (prisma as any).pageAdmin.findFirst({
        where: {
          pageId: pagePoll.pageId,
          userId: session.user.id,
        },
      });

      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only admins can close polls' },
          { status: 403 }
        );
      }

      const closed = await (prisma as any).pagePoll.update({
        where: { id: pollId },
        data: {
          status: 'closed',
          closedAt: new Date(),
        },
      });

      return NextResponse.json(closed);
    }

    const groupPoll = await (prisma as any).groupPoll.findUnique({
      where: { id: pollId },
    });

    if (groupPoll) {
      const group = await (prisma as any).group.findUnique({
        where: { id: groupPoll.groupId },
      });

      if (group?.adminId !== session.user.id) {
        return NextResponse.json(
          { error: 'Only admins can close polls' },
          { status: 403 }
        );
      }

      const closed = await (prisma as any).groupPoll.update({
        where: { id: pollId },
        data: {
          status: 'closed',
          closedAt: new Date(),
        },
      });

      return NextResponse.json(closed);
    }

    return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
  } catch (error) {
    console.error('Error closing poll:', error);
    return NextResponse.json(
      { error: 'Failed to close poll' },
      { status: 500 }
    );
  }
}
