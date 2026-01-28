import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Get friends' IDs
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: userId, status: 'accepted' },
          { user2Id: userId, status: 'accepted' }
        ]
      },
      select: {
        user1Id: true,
        user2Id: true
      }
    });

    const friendIds = friendships.map(f => f.user1Id === userId ? f.user2Id : f.user1Id);

    // Include user's own stories
    friendIds.push(userId);

    // Get active stories (not expired)
    const stories = await prisma.story.findMany({
      where: {
        userId: {
          in: friendIds
        },
        expiresAt: {
          gt: new Date()
        }
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true
          }
        },
        views: {
          where: {
            userId: userId
          },
          select: {
            id: true
          }
        },
        reactions: {
          select: {
            emoji: true,
            user: {
              select: {
                username: true
              }
            }
          }
        },
        _count: {
          select: {
            views: true,
            reactions: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Group stories by user
    const storiesByUser = stories.reduce((acc, story) => {
      const userId = story.userId;
      if (!acc[userId]) {
        acc[userId] = {
          user: story.user,
          stories: []
        };
      }
      acc[userId].stories.push({
        id: story.id,
        imageUrl: story.imageUrl,
        videoUrl: story.videoUrl,
        text: story.text,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        isViewed: story.views.length > 0,
        viewCount: story._count.views,
        reactionCount: story._count.reactions,
        reactions: story.reactions
      });
      return acc;
    }, {} as Record<string, any>);

    const result = Object.values(storiesByUser);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching stories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, videoUrl, text } = await request.json();

    if (!imageUrl && !videoUrl && !text) {
      return NextResponse.json({ error: 'At least one content field is required' }, { status: 400 });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Stories expire in 24 hours

    const story = await prisma.story.create({
      data: {
        imageUrl,
        videoUrl,
        text,
        userId: session.user.id,
        expiresAt
      },
      include: {
        user: {
          select: {
            username: true,
            fullName: true,
            avatar: true
          }
        }
      }
    });

    return NextResponse.json(story);
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}