import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Single consolidated groups route
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'discover';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');
    const session = await getServerSession(authOptions);

    if (type === 'my' && session?.user?.id) {
      const groups = await prisma.group.findMany({
        where: {
          members: { some: { userId: session.user.id } },
        },
        orderBy: { createdAt: 'desc' },
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

      return NextResponse.json(groups);
    }

    // Discover/public groups - exclude user's own groups
    let userGroupIds: string[] = [];
    if (session?.user?.id) {
      const userGroups = await prisma.group.findMany({
        where: {
          members: { some: { userId: session.user.id } },
        },
        select: { id: true },
      });
      userGroupIds = userGroups.map(g => g.id);
    }

    const groups = await prisma.group.findMany({
      where: {
        isPrivate: false,
        NOT: {
          id: { in: userGroupIds }
        }
      },
      orderBy: { createdAt: 'desc' },
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

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    // Check if it's a database connection error
    if (error instanceof Error) {
      if (error.message.includes('P1001') || error.message.includes('Can\'t reach database')) {
        console.warn('Database connection error - returning empty groups array');
      }
    }
    // Return safe empty response to prevent client fetch failures
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, description, image, isPrivate } = body;
    if (!name) return NextResponse.json({ error: 'Group name required' }, { status: 400 });

    const group = await prisma.group.create({
      data: {
        name,
        description,
        image,
        adminId: session.user.id,
        isPrivate: isPrivate ?? false,
      },
    });

    return NextResponse.json(group, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    // Check if it's a database connection error
    if (error instanceof Error) {
      if (error.message.includes('P1001') || error.message.includes('Can\'t reach database')) {
        return NextResponse.json({ error: 'Database temporarily unavailable' }, { status: 503 });
      }
    }
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
}
