import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/badges/groups
 * Récupère le nombre d'invitations de groupe en attente
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // The GroupMember.joinedAt is non-nullable in schema; there is no explicit 'pending' flag.
    // For now, return 0 pending invites to satisfy typings until invite logic is implemented.
    const count = 0;

    return NextResponse.json({
      success: true,
      count
    });
  } catch (error) {
    console.error('Error fetching groups badge:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch badge' },
      { status: 500 }
    );
  }
}
