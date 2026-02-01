import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/posts/[postId] - Get a single post with all details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            isVerified: true,
            bio: true,
          },
        },
        media: true,
        comments: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
                isVerified: true,
              },
            },
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    fullName: true,
                    avatar: true,
                    isVerified: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'asc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        likes: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        shares: true,
        _count: {
          select: {
            comments: true,
            likes: true,
            reactions: true,
            shares: true,
          },
        },
      },
    });

    if (!post || post.isDeleted) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}

// DELETE /api/posts/[postId] - Delete a post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { postId } = await params;

    // Verify ownership
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only delete your own posts' },
        { status: 403 }
      );
    }

    // Soft delete
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: { isDeleted: true },
    });

    try {
      const { publishPostEvent } = await import('@/lib/postEvents');
      publishPostEvent({ type: 'deleted', payload: { id: postId } });
    } catch (e) {
      console.warn('Failed to publish post deleted event', e);
    }

    return NextResponse.json({
      message: 'Post deleted successfully',
      post: updatedPost,
    });
  } catch (error) {
    console.error('Error deleting post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

// PUT /api/posts/[postId] - Update a post
export async function PUT(
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
    const { content, background } = body;

    // Verify ownership
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    if (post.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Forbidden: You can only edit your own posts' },
        { status: 403 }
      );
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        content: content ?? post.content,
        background: background ?? post.background,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            isVerified: true,
          },
        },
        media: true,
        _count: {
          select: {
            comments: true,
            likes: true,
            reactions: true,
          },
        },
      },
    });

    try {
      const { publishPostEvent } = await import('@/lib/postEvents');
      publishPostEvent({ type: 'updated', payload: updatedPost });
    } catch (e) {
      console.warn('Failed to publish post updated event', e);
    }

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}
