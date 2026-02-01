import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getNotificationMessage, getNotificationTitle } from '@/lib/translations';
import { publishNotificationToUsers } from '@/app/api/realtime/broadcast';

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
            avatar: true,
            isVerified: true
          }
        },
        views: {
          include: {
            user: {
              select: {
                username: true
              }
            }
          }
        },
        reactions: {
          include: {
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
        background: story.background,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        isViewed: story.views.some(v => v.userId === userId),
        viewCount: story._count.views,
        reactionCount: story._count.reactions,
        reactions: story.reactions.map(r => ({
          emoji: r.emoji,
          user: {
            username: r.user.username
          }
        }))
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

    const { imageUrl, videoUrl, text, background } = await request.json();

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
        background: text ? background : undefined,  // Only store background for text stories
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

    // Notify friends about new story
    try {
      const friendships = await prisma.friendship.findMany({
        where: {
          OR: [
            { user1Id: session.user.id, status: 'accepted' },
            { user2Id: session.user.id, status: 'accepted' }
          ]
        },
        select: {
          user1Id: true,
          user2Id: true
        }
      });

      const friendIds = friendships.map(f => f.user1Id === session.user.id ? f.user2Id : f.user1Id);

      if (friendIds.length > 0) {
        const actorName = story.user.fullName || story.user.username || 'Utilisateur';
        const notificationTitle = getNotificationTitle('storyCreated', 'fr');
        const notificationContent = getNotificationMessage('storyCreated', actorName, 'fr');
        
        const notifData = friendIds.map((fid) => ({
          type: 'story',
          title: notificationTitle,
          content: notificationContent,
          url: `/stories/${story.id}`,
          userId: fid,
          actorId: session.user.id,
        }));

        await prisma.notification.createMany({ data: notifData, skipDuplicates: true });
        
        // Publish via SSE to connected clients
        friendIds.forEach(friendId => {
          publishNotificationToUsers([friendId], {
            id: `notif_${story.id}_${Date.now()}`,
            type: 'story',
            title: notificationTitle,
            content: notificationContent,
            url: `/stories/${story.id}`,
            actorId: session.user.id,
            createdAt: new Date(),
          });
        });
      }
    } catch (notifErr) {
      console.error('Failed to create story notifications:', notifErr);
    }

    return NextResponse.json(story);
  } catch (error) {
    console.error('Error creating story:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}