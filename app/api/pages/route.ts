import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 100);
    const offset = parseInt(url.searchParams.get('offset') || '0');

    // Basic discover: most-followed pages
    const pages = await prisma.page.findMany({
      where: {},
      orderBy: { followers: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        avatar: true,
        coverImage: true,
        followers: true,
        category: true,
      },
    });

    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error in /api/pages', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}
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
          OR: [
            { admins: { some: { userId: session.user.id } } },
            { members: { some: { userId: session.user.id } } },
          ],
        },
        include: {
          admins: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
          members: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(pages);
    }

    // Get discover pages (public listing)
    const pages = await prisma.page.findMany({
      include: {
        admins: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
          },
        },
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
    const { name, description, image } = body;

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
        image,
        admins: {
          create: {
            userId: session.user.id,
            role: 'admin',
          },
        },
      },
      include: {
        admins: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                fullName: true,
                avatar: true,
              },
            },
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
