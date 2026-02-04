import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createFollowNotification } from '@/lib/notificationService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { groupId } = await params;

    // Check if user is already a member of this group
    const existingMember = await prisma.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: session.user.id,
        },
      },
    });

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: { id: true, name: true, adminId: true },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (existingMember) {
      // Leave group
      await prisma.groupMember.delete({
        where: {
          groupId_userId: {
            groupId,
            userId: session.user.id,
          },
        },
      });

      return NextResponse.json({
        success: true,
        action: 'left',
      });
    } else {
      // Join group
      await prisma.groupMember.create({
        data: {
          groupId,
          userId: session.user.id,
        },
      });

      // Get current user info for notification
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { username: true, avatar: true },
      });

      // Create notification for group admin
      if (group.adminId && group.adminId !== session.user.id && currentUser?.username) {
        await createFollowNotification(
          groupId,
          session.user.id,
          currentUser.username,
          currentUser.avatar || undefined
        );
      }

      return NextResponse.json({
        success: true,
        action: 'joined',
      });
    }
  } catch (error) {
    console.error('Error handling group join:', error);
    return NextResponse.json(
      { error: 'Failed to handle group join' },
      { status: 500 }
    );
  }
}
