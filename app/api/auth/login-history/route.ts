import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/auth/login-history - Get login history
// - With auth: returns current user's login history
// - Without auth: returns recent logins with user info (for login page)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const searchParams = request.nextUrl.searchParams;
    const includeUserInfo = searchParams.get('includeUserInfo') === 'true';

    if (session?.user?.id) {
      // Authenticated: Get current user's login history
      const loginHistory = await prisma.loginHistory.findMany({
        where: {
          userId: session.user.id,
        },
        select: {
          id: true,
          loginAt: true,
          userAgent: true,
          ipAddress: true,
        },
        orderBy: { loginAt: 'desc' },
        take: 50,
      });

      return NextResponse.json(loginHistory);
    } else if (includeUserInfo) {
      // Not authenticated but want user info: Get recent unique logins (for login page)
      const recentLogins = await prisma.loginHistory.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              email: true,
            },
          },
        },
        orderBy: { loginAt: 'desc' },
        take: 50,
      });

      // Group by userId to get unique users (most recent login for each)
      const uniqueLogins = new Map();
      const result = [];
      
      for (const login of recentLogins) {
        if (!uniqueLogins.has(login.userId)) {
          uniqueLogins.set(login.userId, true);
          result.push(login);
          if (result.length >= 10) break; // Limit to 10 recent users
        }
      }

      return NextResponse.json(result);
    } else {
      // Not authenticated and no user info requested
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Get login history error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch login history' },
      { status: 500 }
    );
  }
}

// POST /api/auth/login-history - Record a login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { userId, email, userAgent, ipAddress } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // If userId is not provided, find it from email
    if (!userId) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        );
      }
      userId = user.id;
    }

    // Record login
    await prisma.loginHistory.create({
      data: {
        userId,
        email,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording login history:', error);
    return NextResponse.json(
      { error: 'Failed to record login' },
      { status: 500 }
    );
  }
}

// DELETE /api/auth/login-history - Delete a login history entry by id
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body || {};

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await prisma.loginHistory.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting login history:', error);
    return NextResponse.json(
      { error: 'Failed to delete login history' },
      { status: 500 }
    );
  }
}
