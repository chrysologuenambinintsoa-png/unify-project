import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/stories/published/[storyId]
 * Récupère les détails complets d'une story publiée avec les reactions
 */
export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const { storyId } = context?.params || {};

    const story = await prisma.story.findUnique({
      where: { id: storyId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            isVerified: true,
            bio: true
          }
        },
        views: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
              }
            }
          },
          take: 50 // Limiter à 50 dernières vues
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true
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
      }
    });

    if (!story) {
      return NextResponse.json(
        { success: false, error: 'Story not found' },
        { status: 404 }
      );
    }

    // Vérifier que la story n'est pas expirée
    if (story.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Story has expired' },
        { status: 410 } // Gone
      );
    }

    // Formater la réponse
    const formattedStory = {
      id: story.id,
      imageUrl: story.imageUrl,
      videoUrl: story.videoUrl,
      text: story.text,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
      user: story.user,
      stats: {
        viewCount: story._count.views,
        reactionCount: story._count.reactions
      },
      views: story.views.map(view => ({
        userId: view.user.id,
        username: view.user.username,
        avatar: view.user.avatar,
        viewedAt: view.viewedAt
      })),
      reactions: story.reactions.map(reaction => ({
        emoji: reaction.emoji,
        userId: reaction.user.id,
        username: reaction.user.username,
        avatar: reaction.user.avatar,
        createdAt: reaction.createdAt
      })),
      reactionSummary: story.reactions.reduce((acc, reaction) => {
        acc[reaction.emoji] = (acc[reaction.emoji] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };

    return NextResponse.json({
      success: true,
      data: formattedStory
    });
  } catch (error) {
    console.error('Error fetching story details:', error);
    // Return a safe response to avoid client-side fetch() throwing
    return NextResponse.json({
      success: false,
      data: null
    });
  }
}
