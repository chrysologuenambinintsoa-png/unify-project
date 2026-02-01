import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/auth/login-history - Get recent login history (no session required)
export async function GET(request: NextRequest) {
  try {
    // Get recent login history (last 50 logins across all users)
    const loginHistory = await prisma.loginHistory.findMany({
      select: {
        id: true,
        userId: true,
        email: true,
        loginAt: true,
        userAgent: true,
        ipAddress: true,
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

    return NextResponse.json(loginHistory);
  } catch (error) {
    console.error('Error fetching login history:', error);
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
