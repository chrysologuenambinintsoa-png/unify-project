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

    // Calculate mutual friends (friends-of-friends) efficiently
    const mutualCounts = new Map<string, number>();
    const friendIdsArray = Array.from(friendIds);

    if (friendIdsArray.length > 0) {
      const friendsOfFriends = await prisma.friendship.findMany({
        where: {
          status: 'accepted',
          OR: [
            { user1Id: { in: friendIdsArray } },
            { user2Id: { in: friendIdsArray } },
          ],
        },
        select: { user1Id: true, user2Id: true },
      });

      friendsOfFriends.forEach((f) => {
        let candidateId: string | null = null;
        if (friendIds.has(f.user1Id)) candidateId = f.user2Id;
        else if (friendIds.has(f.user2Id)) candidateId = f.user1Id;

        if (!candidateId) return;
        if (excludedUserIds.has(candidateId)) return;

        mutualCounts.set(candidateId, (mutualCounts.get(candidateId) || 0) + 1);
      });
    }

    // Build suggestion list from mutuals first (sorted by mutual count)
    const candidateIds = Array.from(mutualCounts.keys());
    let suggestions: Array<any> = [];

    if (candidateIds.length > 0) {
      const candidates = await prisma.user.findMany({
        where: { id: { in: candidateIds } },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          bio: true,
          _count: { select: { friends1: true, friends2: true } },
        },
      });

      suggestions = candidates.map((u) => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        avatar: u.avatar,
        bio: u.bio,
        mutualFriendsCount: mutualCounts.get(u.id) || 0,
        friendsCount: (u._count?.friends1 || 0) + (u._count?.friends2 || 0),
      }));

      // Sort by mutual friends desc
      suggestions.sort((a, b) => b.mutualFriendsCount - a.mutualFriendsCount);
    }

    // If not enough suggestions, append newest/popular users excluding already excluded ones
    if (suggestions.length < limit) {
      const toExclude = new Set([...Array.from(excludedUserIds), ...candidateIds]);
      const more = await prisma.user.findMany({
        where: { id: { notIn: Array.from(toExclude) } },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          bio: true,
          _count: { select: { friends1: true, friends2: true } },
        },
        take: limit - suggestions.length,
        skip: offset,
      });

      suggestions = suggestions.concat(
        more.map((u) => ({
          id: u.id,
          username: u.username,
          fullName: u.fullName,
          avatar: u.avatar,
          bio: u.bio,
          mutualFriendsCount: 0,
          friendsCount: (u._count?.friends1 || 0) + (u._count?.friends2 || 0),
        }))
      );
    }

    const totalCount = await prisma.user.count({
      where: { id: { notIn: Array.from(excludedUserIds) } },
    });

    return NextResponse.json({ suggestions: suggestions.slice(0, limit), total: totalCount, limit, offset });
  } catch (error) {
    console.error('Error fetching friend suggestions:', error);
    // Return safe empty response to prevent client fetch failures
    return NextResponse.json(
      { suggestions: [], total: 0, limit: 20, offset: 0 },
      { status: 200 }
    );
  }
}
