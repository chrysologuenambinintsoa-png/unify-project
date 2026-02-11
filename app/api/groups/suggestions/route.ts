import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/groups/suggestions
 * Suggest groups to a user based on:
 * - groups where the user's friends are members (sorted by number of friends in group)
 * - fallback to popular public groups
 * Excludes groups where the user is already a member.
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50);
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const session = await getServerSession(authOptions);

    // If unauthenticated, return popular public groups
    if (!session?.user?.id) {
      const popular = await prisma.group.findMany({
        where: { isPrivate: false },
        orderBy: { membersCount: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          isPrivate: true,
          createdAt: true,
          _count: { select: { members: true } },
        },
      });

      return NextResponse.json({ suggestions: popular, total: await prisma.group.count({ where: { isPrivate: false } }), limit, offset });
    }

    const userId = session.user.id;

    // Get groups the user is already a member of or admin of
    const memberGroups = await prisma.groupMember.findMany({ where: { userId }, select: { groupId: true } });
    const adminGroups = await prisma.group.findMany({ where: { adminId: userId }, select: { id: true } });
    const userGroupIds = new Set<string>([...memberGroups.map(g => g.groupId), ...adminGroups.map(g => g.id)]);

    // Get user's friends
    const userFriendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: userId, status: 'accepted' },
          { user2Id: userId, status: 'accepted' },
        ],
      },
      select: { user1Id: true, user2Id: true },
    });

    const friendIds = new Set<string>();
    userFriendships.forEach((f) => {
      if (f.user1Id === userId) friendIds.add(f.user2Id);
      if (f.user2Id === userId) friendIds.add(f.user1Id);
    });

    const friendIdsArray = Array.from(friendIds);
    const groupMutualCounts = new Map<string, number>();

    if (friendIdsArray.length > 0) {
      const friendsMemberships = await prisma.groupMember.findMany({
        where: { userId: { in: friendIdsArray } },
        select: { groupId: true, userId: true },
      });

      friendsMemberships.forEach((m) => {
        if (userGroupIds.has(m.groupId)) return; // exclude groups user already in
        groupMutualCounts.set(m.groupId, (groupMutualCounts.get(m.groupId) || 0) + 1);
      });
    }

    let suggestions: Array<any> = [];
    const candidateGroupIds = Array.from(groupMutualCounts.keys());

    if (candidateGroupIds.length > 0) {
      const groups = await prisma.group.findMany({
        where: { id: { in: candidateGroupIds }, isPrivate: false },
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          isPrivate: true,
          createdAt: true,
          _count: { select: { members: true } },
          members: { where: { userId }, select: { userId: true } },
        },
      });

      suggestions = groups.map((g) => ({
        id: g.id,
        name: g.name,
        description: g.description,
        image: g.image,
        isPrivate: g.isPrivate,
        createdAt: g.createdAt,
        membersCount: g._count?.members ?? 0,
        isMember: Array.isArray(g.members) ? g.members.length > 0 : false,
        mutualFriendsCount: groupMutualCounts.get(g.id) || 0,
      }));

      suggestions.sort((a, b) => b.mutualFriendsCount - a.mutualFriendsCount);
    }

    // Fill up with popular public groups if not enough
    if (suggestions.length < limit) {
      const exclude = new Set([...userGroupIds, ...candidateGroupIds]);
      const more = await prisma.group.findMany({
        where: { isPrivate: false, id: { notIn: Array.from(exclude) } },
        orderBy: { _count: { members: 'desc' } },
        select: {
          id: true,
          name: true,
          description: true,
          image: true,
          isPrivate: true,
          createdAt: true,
          _count: { select: { members: true } },
          members: { where: { userId }, select: { userId: true } },
        },
        take: limit - suggestions.length,
        skip: offset,
      });

      suggestions = suggestions.concat(
        more.map((g) => ({
          id: g.id,
          name: g.name,
          description: g.description,
          image: g.image,
          isPrivate: g.isPrivate,
          createdAt: g.createdAt,
          membersCount: g._count?.members ?? 0,
          isMember: Array.isArray(g.members) ? g.members.length > 0 : false,
          mutualFriendsCount: 0,
        }))
      );
    }

    const total = await prisma.group.count({ where: { isPrivate: false, id: { notIn: Array.from(userGroupIds) } } });

    return NextResponse.json({ suggestions: suggestions.slice(0, limit), total, limit, offset });
  } catch (error) {
    console.error('Error fetching group suggestions:', error);
    return NextResponse.json({ suggestions: [], total: 0, limit: 10, offset: 0 }, { status: 200 });
  }
}
