import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/posts/[postId]/report - Report a post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      );
    }

    // Verify post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Prevent users from reporting their own posts
    if (post.userId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot report your own post' },
        { status: 403 }
      );
    }

    // Check if user already reported this post
    const existingReport = await prisma.postReport.findFirst({
      where: {
        postId: postId,
        reporterId: session.user.id,
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: 'You have already reported this post' },
        { status: 400 }
      );
    }

    // Create report
    const report = await prisma.postReport.create({
      data: {
        postId: postId,
        reporterId: session.user.id,
        reason: reason.trim(),
      },
    });

    return NextResponse.json(
      {
        message: 'Post reported successfully',
        report,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error reporting post:', error);
    return NextResponse.json(
      { error: 'Failed to report post' },
      { status: 500 }
    );
  }
}
