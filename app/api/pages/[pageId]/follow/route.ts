import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createFollowNotification } from '@/lib/notificationService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId } = await params;

    // Check if user is already a member of this page (following it)
    const existingMember = await prisma.pageMember.findUnique({
      where: {
        pageId_userId: {
          pageId,
          userId: session.user.id,
        },
      },
    });

    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true, name: true },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    if (existingMember) {
      // Unfollow (remove member)
      await prisma.pageMember.delete({
        where: {
          pageId_userId: {
            pageId,
            userId: session.user.id,
          },
        },
      });

      return NextResponse.json({
        success: true,
        action: 'unfollowed',
      });
    } else {
      // Follow (add as member)
      await prisma.pageMember.create({
        data: {
          pageId,
          userId: session.user.id,
          role: 'member',
        },
      });

      // Get current user info for notification
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { username: true, avatar: true },
      });

      // Create notification for page admin
      if (currentUser?.username) {
        await createFollowNotification(
          pageId,
          session.user.id,
          currentUser.username,
          currentUser.avatar || undefined
        );
      }

      return NextResponse.json({
        success: true,
        action: 'followed',
      });
    }
  } catch (error) {
    console.error('Error handling page follow:', error);
    return NextResponse.json(
      { error: 'Failed to handle page follow' },
      { status: 500 }
    );
  }
}
