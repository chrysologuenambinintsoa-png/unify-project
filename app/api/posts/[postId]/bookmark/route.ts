import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/posts/[postId]/bookmark - Bookmark a post
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await context.params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if already bookmarked
    const existingBookmark = await prisma.bookmark.findFirst({
      where: {
        userId: session.user.id,
        postId,
      },
    });

    if (existingBookmark) {
      return NextResponse.json(
        { error: 'Post already bookmarked' },
        { status: 400 }
      );
    }

    const bookmark = await prisma.bookmark.create({
      data: {
        userId: session.user.id,
        postId,
      },
    });

    return NextResponse.json(bookmark, { status: 201 });
  } catch (error) {
    console.error('Error bookmarking post:', error);
    return NextResponse.json(
      { error: 'Failed to bookmark post' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[postId]/bookmark - Remove bookmark
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await context.params;

    await prisma.bookmark.deleteMany({
      where: {
        userId: session.user.id,
        postId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing bookmark:', error);
    return NextResponse.json(
      { error: 'Failed to remove bookmark' },
      { status: 500 }
    );
  }
}
