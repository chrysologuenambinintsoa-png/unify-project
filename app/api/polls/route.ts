import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/polls - Create new poll
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, groupId, question, description, options, allowMultiple } = body;

    if (!pageId && !groupId) {
      return NextResponse.json(
        { error: 'Either pageId or groupId is required' },
        { status: 400 }
      );
    }

    // Verify permissions
    if (pageId) {
      const isAdmin = await (prisma as any).pageAdmin.findFirst({
        where: { pageId, userId: session.user.id },
      });

      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only page admins can create polls' },
          { status: 403 }
        );
      }

      const poll = await (prisma as any).pagePoll.create({
        data: {
          pageId,
          createdBy: session.user.id,
          question,
          description,
          allowMultiple: allowMultiple || false,
          options: {
            create: options.map((opt: string) => ({ text: opt })),
          },
        },
        include: {
          options: true,
        },
      });

      return NextResponse.json(poll, { status: 201 });
    }

    if (groupId) {
      const group = await (prisma as any).group.findUnique({
        where: { id: groupId },
      });

      if (group?.adminId !== session.user.id) {
        return NextResponse.json(
          { error: 'Only group admins can create polls' },
          { status: 403 }
        );
      }

      const poll = await (prisma as any).groupPoll.create({
        data: {
          groupId,
          createdBy: session.user.id,
          question,
          description,
          allowMultiple: allowMultiple || false,
          options: {
            create: options.map((opt: string) => ({ text: opt })),
          },
        },
        include: {
          options: true,
        },
      });

      return NextResponse.json(poll, { status: 201 });
    }
  } catch (error) {
    console.error('Error creating poll:', error);
    return NextResponse.json(
      { error: 'Failed to create poll' },
      { status: 500 }
    );
  }
}

// GET /api/polls - Get polls
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const groupId = searchParams.get('groupId');

    if (pageId) {
      const polls = await (prisma as any).pagePoll.findMany({
        where: { pageId },
        include: {
          options: {
            include: {
              votes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(polls);
    }

    if (groupId) {
      const polls = await (prisma as any).groupPoll.findMany({
        where: { groupId },
        include: {
          options: {
            include: {
              votes: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(polls);
    }

    return NextResponse.json({ error: 'pageId or groupId required' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching polls:', error);
    return NextResponse.json(
      { error: 'Failed to fetch polls' },
      { status: 500 }
    );
  }
}
