import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/posts - Get all posts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only return posts from the last 72 hours
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);

    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        createdAt: {
          gte: cutoff,
        },
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
        comments: {
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
          take: 5,
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
        },
        _count: {
          select: {
            comments: true,
            likes: true,
            reactions: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

// POST /api/posts - Create a new post
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, background, media } = body;

    if (!content?.trim() && !media?.length) {
      return NextResponse.json(
        { error: 'Content or media is required' },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        content,
        background,
        userId: session.user.id,
        media: media ? {
          create: media.map((m: any) => ({
            type: m.type,
            url: m.url,
          })),
        } : undefined,
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
      },
    });

    try {
      const { publishPostEvent } = await import('@/lib/postEvents');
      publishPostEvent({ type: 'created', payload: post });
    } catch (e) {
      // best-effort
      console.warn('Failed to publish post created event', e);
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Error creating post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}