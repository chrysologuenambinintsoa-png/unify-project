import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/posts - Get all posts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // Only return posts from the last 72 hours
    const cutoff = new Date(Date.now() - 72 * 60 * 60 * 1000);

    // Determine requester and their friends to enforce visibility
    const requesterId = session?.user?.id || null;
    let friendIds: string[] = [];
    if (requesterId) {
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { user1Id: requesterId },
            { user2Id: requesterId },
          ],
          status: 'accepted',
        },
      });
      friendIds = friendships.map((f) => (f.user1Id === requesterId ? f.user2Id : f.user1Id));
    }

    const posts = await prisma.post.findMany({
      where: {
        isDeleted: false,
        createdAt: {
          gte: cutoff,
        },
        OR: requesterId
          ? [
              { isPublic: true },
              { userId: requesterId },
              { userId: { in: friendIds } },
            ]
          : [{ isPublic: true }],
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
    // Check if it's a database connection error
    if (error instanceof Error) {
      if (error.message.includes('P1001') || error.message.includes('Can\'t reach database')) {
        console.warn('Database connection error - returning empty posts array');
        return NextResponse.json([], { status: 200 });
      }
    }
    // For other errors, also return empty array to maintain functionality
    return NextResponse.json([], { status: 200 });
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
    const { content, background, media, isTextPost, styling, isPublic } = body;

    if (!content?.trim() && !media?.length) {
      return NextResponse.json(
        { error: 'Content or media is required' },
        { status: 400 }
      );
    }

    const post = await prisma.post.create({
      data: {
        content,
        background: isTextPost ? (styling?.background || 'gradient-1') : background,
        userId: session.user.id,
        styling: isTextPost ? styling : undefined,
        isPublic: typeof isPublic === 'boolean' ? isPublic : false,
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

    // Ensure uploaded images are saved to the user's photo gallery
    try {
      const imageMedia = (post.media || []).filter((m: any) => m.type === 'image');
      if (imageMedia.length > 0) {
        const data = imageMedia.map((m: any) => ({ userId: session.user.id, url: m.url, type: 'gallery', caption: null }));
        // Use createMany as best-effort; skipDuplicates if available
        await (prisma as any).photoGallery.createMany({ data, skipDuplicates: true });
      }
    } catch (e) {
      console.warn('Failed to save images to photo gallery (non-fatal)', e);
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