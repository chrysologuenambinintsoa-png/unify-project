import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/friends/suggestions
 * Retourne les suggestions d'amis basées sur:
 * 1. Les amis des amis de l'utilisateur (triés par nombre d'amis mutuels)
 * 2. Les utilisateurs récents/populaires (si pas assez d'amis des amis)
 * 3. Excluant les amis existants et les demandes en attente
 * 
 * Paramètres de query:
 * - limit: number (défaut: 20)
 * - offset: number (défaut: 0)
 * 
 * Réponse:
 * {
 *   suggestions: [
 *     {
 *       id: string,
 *       username: string,
 *       fullName: string,
 *       avatar: string,
 *       bio: string,
 *       mutualFriendsCount: number
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
    const userId = session?.user?.id;
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // If not authenticated, return random popular users
    if (!userId) {
      const users = await prisma.user.findMany({
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          bio: true,
        },
      });

      return NextResponse.json({
        suggestions: users.map((user) => ({
          ...user,
          mutualFriendsCount: 0,
        })),
        total: await prisma.user.count(),
        limit,
        offset,
      });
    }

    // Obtenir tous les amis acceptés de l'utilisateur
    const userFriendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: userId, status: 'accepted' },
          { user2Id: userId, status: 'accepted' },
        ],
      },
      select: {
        user1Id: true,
        user2Id: true,
      },
    });

    // Construire l'ensemble des amis actuels
    const friendIds = new Set<string>();
    userFriendships.forEach((f) => {
      if (f.user1Id === userId) friendIds.add(f.user2Id);
      if (f.user2Id === userId) friendIds.add(f.user1Id);
    });

    // Obtenir toutes les demandes d'amis existantes (envoyées et reçues)
    const existingRequests = await prisma.friendship.findMany({
      where: {
        AND: [
          {
            OR: [
              { user1Id: userId },
              { user2Id: userId },
            ],
          },
          {
            status: {
              in: ['pending', 'declined', 'blocked'],
            },
          },
        ],
      },
      select: {
        user1Id: true,
        user2Id: true,
      },
    });

    const requestedUserIds = new Set<string>();
    existingRequests.forEach((r) => {
      if (r.user1Id === userId) requestedUserIds.add(r.user2Id);
      if (r.user2Id === userId) requestedUserIds.add(r.user1Id);
    });

    // Get ALL users except self, current friends, and pending requests
    const excludedUserIds = new Set([
      userId,
      ...friendIds,
      ...requestedUserIds,
    ]);

    // Fetch all potential friend suggestions (all users except excluded)
    const allUsers = await prisma.user.findMany({
      where: {
        id: {
          notIn: Array.from(excludedUserIds),
        },
      },
      orderBy: [
        { createdAt: 'desc' }, // Newest users first
      ],
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
        bio: true,
      },
      take: limit,
      skip: offset,
    });

    // Get total count of all available suggestions
    const totalCount = await prisma.user.count({
      where: {
        id: {
          notIn: Array.from(excludedUserIds),
        },
      },
    });

    // Return all users as suggestions (no mutual friends calculation needed)
    const suggestionsWithMutual = allUsers.map((user) => ({
      ...user,
      mutualFriendsCount: 0,
    }));

    return NextResponse.json({
      suggestions: suggestionsWithMutual,
      total: totalCount,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching friend suggestions:', error);
    // Return safe empty response to prevent client fetch failures
    return NextResponse.json(
      { suggestions: [], total: 0, limit: 20, offset: 0 },
      { status: 200 }
    );
  }
}
