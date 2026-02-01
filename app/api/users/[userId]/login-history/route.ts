import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/[userId]/login-history - Get login history for a user
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const session = await getServerSession(authOptions);

    // Only allow users to view their own login history
    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    const loginHistory = await prisma.loginHistory.findMany({
      where: { userId },
      select: {
        id: true,
        loginAt: true,
        userAgent: true,
        ipAddress: true,
      },
      orderBy: { loginAt: 'desc' },
      take: 50, // Last 50 logins
    });

    return NextResponse.json(loginHistory);
  } catch (error) {
    console.error('Error fetching login history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch login history' },
      { status: 500 }
    );
  }
}
