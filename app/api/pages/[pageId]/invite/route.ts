import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, props: { params: Promise<{ pageId: string }> }) {
  const params = await props.params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId } = params;
    const { userIds } = await request.json();

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    // Check if user is admin of the page
    const pageAdmin = await prisma.pageAdmin.findFirst({
      where: {
        pageId,
        userId: session.user.id,
      },
    });

    if (!pageAdmin) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Add users to page as admins
    const results = [];
    for (const userId of userIds) {
      try {
        // Check if user is already an admin
        const existing = await prisma.pageAdmin.findUnique({
          where: {
            pageId_userId: {
              pageId,
              userId,
            },
          },
        });

        if (!existing) {
          await prisma.pageAdmin.create({
            data: {
              pageId,
              userId,
            },
          });
          results.push({ userId, status: 'added' });
        } else {
          results.push({ userId, status: 'already_admin' });
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
    return NextResponse.json({ error: 'Failed to invite admins' }, { status: 500 });
  }
}
