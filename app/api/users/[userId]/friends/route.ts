import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/users/[userId]/friends
 * Retourne la liste des amis acceptés pour un utilisateur
 * 
 * Réponse:
 * Array<{
 *   id: string,
 *   username: string,
 *   fullName: string,
 *   avatar: string | null,
 *   bio: string | null
 * }>
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get accepted friendships
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          { user1Id: userId, status: 'accepted' },
          { user2Id: userId, status: 'accepted' },
        ],
      },
      select: {
        user1Id: true,
        user2Id: true,
        user1: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            bio: true,
          },
        },
        user2: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            bio: true,
          },
        },
      },
    });

    // Extract friend data
    const friends = friendships.map((f) => {
      if (f.user1Id === userId) {
        return f.user2;
      } else {
        return f.user1;
      }
    });

    return NextResponse.json(friends, { status: 200 });
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch friends' },
      { status: 500 }
    );
  }
}
