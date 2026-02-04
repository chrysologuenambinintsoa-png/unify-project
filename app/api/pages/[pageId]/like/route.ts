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

    // For now, just return success
    // In a full implementation, you would track likes with a PageLike model
    const isLiked = Math.random() > 0.5; // Mock state

    return NextResponse.json({
      success: true,
      action: isLiked ? 'liked' : 'unliked',
    });
  } catch (error) {
    console.error('Error handling page like:', error);
    return NextResponse.json(
      { error: 'Failed to handle page like' },
      { status: 500 }
    );
  }
}
