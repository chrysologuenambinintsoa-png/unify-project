import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, props: { params: Promise<{ groupId: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = params;
    const { userIds } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    // Check if user is admin of the group
    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { adminId: true },
    });

    if (!group || group.adminId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Add users to group
    const results = [];
    for (const userId of userIds) {
      try {
        // Check if user is already a member
        const existing = await prisma.groupMember.findUnique({
          where: {
            groupId_userId: {
              groupId,
              userId,
            },
          },
        });

        if (!existing) {
          await prisma.groupMember.create({
            data: {
              groupId,
              userId,
              role: 'member',
            },
          });
          results.push({ userId, status: 'added' });
        } else {
          results.push({ userId, status: 'already_member' });
        }
      } catch (err) {
        results.push({ userId, status: 'error' });
      }
    }

    return NextResponse.json({
      message: 'Invitations sent',
      results,
    });
  } catch (error) {
    console.error('Invite error:', error);
    return NextResponse.json({ error: 'Failed to invite members' }, { status: 500 });
  }
}
