import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/pages - Get all pages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'discover';

    if (type === 'my') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const pages = await prisma.page.findMany({
        where: {
          ownerId: session.user.id,
          isDeleted: false,
        },
        include: {
          owner: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          followers: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(pages);
    }

    // Get discover pages
    const pages = await prisma.page.findMany({
      where: {
        isDeleted: false,
        isPublic: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
        followers: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
    });

    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pages' },
      { status: 500 }
    );
  }
}

// POST /api/pages - Create a new page
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, category, coverImage, avatar } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Page name is required' },
        { status: 400 }
      );
    }

    const page = await prisma.page.create({
      data: {
        name,
        description,
        category,
        coverImage,
        avatar,
        ownerId: session.user.id,
        isPublic: true,
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json(
      { error: 'Failed to create page' },
      { status: 500 }
    );
  }
}
