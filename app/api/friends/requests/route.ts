import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/friends/requests
 * Retourne les demandes d'amis en attente (reçues par l'utilisateur courant)
 * 
 * Paramètres de query:
 * - limit: number (défaut: 20)
 * - offset: number (défaut: 0)
 * 
 * Réponse:
 * {
 *   requests: [
 *     {
 *       id: string,
 *       fromUser: { id, username, fullName, avatar, bio },
 *       createdAt: string
 *     }
 *   ],
 *   total: number,
 *   limit: number,
 *   offset: number
 * }
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Obtenir le nombre total de demandes en attente
    const total = await prisma.friendship.count({
      where: {
        user2Id: userId,
        status: 'pending',
      },
    });

    // Obtenir les demandes avec les infos utilisateur
    const requests = await prisma.friendship.findMany({
      where: {
        user2Id: userId,
        status: 'pending',
      },
      include: {
        user1: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            bio: true,
            _count: {
              select: {
                friends1: true,
                friends2: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return NextResponse.json({
      requests: requests.map((r) => ({
        id: r.id,
        fromUser: {
          id: r.user1.id,
          username: r.user1.username,
          fullName: r.user1.fullName,
          avatar: r.user1.avatar,
          bio: r.user1.bio,
          friendsCount: (r.user1._count?.friends1 || 0) + (r.user1._count?.friends2 || 0),
        },
        createdAt: r.createdAt.toISOString(),
      })),
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching friend requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friend requests' },
      { status: 500 }
    );
  }
}
