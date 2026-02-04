import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/admin-messages - Send message to page/group admin
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { pageId, groupId, subject, content } = body;

    if (!pageId && !groupId) {
      return NextResponse.json(
        { error: 'Either pageId or groupId is required' },
        { status: 400 }
      );
    }

    // Verify sender is member of page/group
    if (pageId) {
      const isMember = await (prisma as any).pageMember.findFirst({
        where: { pageId, userId: session.user.id },
      });

      if (!isMember) {
        return NextResponse.json(
          { error: 'You must be a member of this page' },
          { status: 403 }
        );
      }
    }

    if (groupId) {
      const isMember = await (prisma as any).groupMember.findFirst({
        where: { groupId, userId: session.user.id },
      });

      if (!isMember) {
        return NextResponse.json(
          { error: 'You must be a member of this group' },
          { status: 403 }
        );
      }
    }

    // Create message
    const message = await (prisma as any).adminMessage.create({
      data: {
        pageId,
        groupId,
        senderId: session.user.id,
        subject,
        content,
        status: 'unread',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending admin message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

// GET /api/admin-messages - Get messages for admin
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId');
    const groupId = searchParams.get('groupId');
    const status = searchParams.get('status') || 'unread';

    const where: any = { status };

    if (pageId) {
      // Verify user is admin of page
      const isAdmin = await (prisma as any).pageAdmin.findFirst({
        where: { pageId, userId: session.user.id },
      });

      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Only page admins can view messages' },
          { status: 403 }
        );
      }

      where.pageId = pageId;
    }

    if (groupId) {
      // Verify user is admin of group
      const group = await (prisma as any).group.findUnique({
        where: { id: groupId },
      });

      if (group?.adminId !== session.user.id) {
        return NextResponse.json(
          { error: 'Only group admins can view messages' },
          { status: 403 }
        );
      }

      where.groupId = groupId;
    }

    const messages = await (prisma as any).adminMessage.findMany({
      where,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
