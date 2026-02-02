import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'discover';
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);
    const offset = parseInt(searchParams.get('offset') || '0');

    if (type === 'my') {
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

      const pages = await prisma.page.findMany({
        where: {
          OR: [
            { admins: { some: { userId: session.user.id } } },
            { members: { some: { userId: session.user.id } } },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          image: true,
          coverImage: true,
          createdAt: true,
          _count: { select: { members: true } },
        },
      });

      return NextResponse.json(pages);
    }

    // Discover pages
    const pages = await prisma.page.findMany({
      where: {},
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        image: true,
        coverImage: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
    });

    return NextResponse.json(pages);
  } catch (error) {
    console.error('Error fetching pages:', error);
    return NextResponse.json({ error: 'Failed to fetch pages' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, description, image, category } = body;
    if (!name) return NextResponse.json({ error: 'Page name required' }, { status: 400 });

    const page = await prisma.page.create({
      data: {
        name,
        description,
        image,
        category,
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }
}
