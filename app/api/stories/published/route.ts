import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/stories/published
 * Récupère toutes les stories publiées (accessibles publiquement)
 * 
 * Query Parameters:
 * - limit: nombre de stories à retourner (par défaut 20)
 * - skip: nombre de stories à sauter pour la pagination (par défaut 0)
 * - userId: optionnel, filtrer par utilisateur spécifique
 */
export async function GET(request: NextRequest) {
  let limit: number = 20;
  let skip: number = 0;
  try {
    const { searchParams } = new URL(request.url);

    limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    skip = parseInt(searchParams.get('skip') || '0');
    const userId = searchParams.get('userId');

    // Construire les conditions where
    const whereConditions: any = {
      expiresAt: {
        gt: new Date() // Seulement les stories non expirées
      }
    };

    if (userId) {
      whereConditions.userId = userId;
    }

    // Récupérer les stories publiées avec pagination
    const [stories, total] = await Promise.all([
      prisma.story.findMany({
        where: whereConditions,
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
          _count: {
            select: {
              views: true,
              reactions: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: limit,
        skip: skip
      }),
      prisma.story.count({
        where: whereConditions
      })
    ]);

    // Formater la réponse
    const formattedStories = stories.map(story => ({
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
      }
    }));

    return NextResponse.json({
      success: true,
      data: formattedStories,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total
      }
    });
  } catch (error) {
    console.error('Error fetching published stories:', error);
    // Return a safe empty response so client hooks don't throw on non-OK
    return NextResponse.json({
      success: false,
      data: [],
      pagination: {
        total: 0,
        limit,
        skip,
        hasMore: false
      }
    });
  }
}
