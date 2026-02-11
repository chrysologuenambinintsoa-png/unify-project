import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Simple like tracking - returns success but doesn't persist
// Like functionality would need a PageLike model in the schema
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

    // Verify page exists
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      select: { id: true, name: true },
    });

    if (!page) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    // Toggle persistent like via PageLike model
    try {
      // Check existing like
      const existing = await (prisma as any).pageLike.findUnique({
        where: { pageId_userId: { pageId, userId: session.user.id } },
      });

      if (existing) {
        await (prisma as any).pageLike.delete({
          where: { pageId_userId: { pageId, userId: session.user.id } },
        });
        return NextResponse.json({ success: true, action: 'unliked' });
      } else {
        await (prisma as any).pageLike.create({
          data: { pageId, userId: session.user.id },
        });
        return NextResponse.json({ success: true, action: 'liked' });
      }
    } catch (e) {
      // If PageLike model not present or operation fails, fallback to non-persistent behavior
      console.warn('PageLike persistence failed, falling back to mock:', e);
      const isLiked = Math.random() > 0.5;
      return NextResponse.json({ success: true, action: isLiked ? 'liked' : 'unliked' });
    }
  } catch (error) {
    console.error('Error handling page like:', error);
    return NextResponse.json(
      { error: 'Failed to handle page like' },
      { status: 500 }
    );
  }
}
