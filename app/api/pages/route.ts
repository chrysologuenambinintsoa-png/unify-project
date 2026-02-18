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
          admins: { where: { userId: session.user.id }, select: { userId: true } },
          members: { where: { userId: session.user.id }, select: { userId: true } },
        },
      });

      // Normalize shape to what the frontend expects
      const mappedMyPages = pages.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        category: p.category,
        avatar: p.image,
        coverImage: p.coverImage,
        createdAt: p.createdAt,
        followerCount: p._count?.members ?? 0,
        isFollowing: Array.isArray(p.members) ? p.members.length > 0 : false,
        isAdmin: Array.isArray(p.admins) ? p.admins.length > 0 : false,
        isLiked: false,
      }));

      return NextResponse.json(mappedMyPages);
    }

    // Discover pages - exclude user's own pages
    const session = await getServerSession(authOptions);
    let userPageIds: string[] = [];
    
    if (session?.user?.id) {
      const userPages = await prisma.page.findMany({
        where: {
          OR: [
            { admins: { some: { userId: session.user.id } } },
            { members: { some: { userId: session.user.id } } },
          ],
        },
        select: { id: true },
      });
      userPageIds = userPages.map(p => p.id);
    }

    const pages = await prisma.page.findMany({
      where: {
        NOT: {
          id: { in: userPageIds }
        }
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
        admins: session?.user?.id ? { where: { userId: session.user.id }, select: { userId: true } } : undefined,
        members: session?.user?.id ? { where: { userId: session.user.id }, select: { userId: true } } : undefined,
      },
    });

    // Map to include isFollowing/isAdmin flags for the current user
    let mapped = pages.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      category: p.category,
      avatar: p.image,
      coverImage: p.coverImage,
      createdAt: p.createdAt,
      followerCount: p._count?.members ?? 0,
      isFollowing: Array.isArray(p.members) ? p.members.length > 0 : false,
      isAdmin: Array.isArray(p.admins) ? p.admins.length > 0 : false,
    }));

    // Try to load liked state if PageLike model exists. Use dynamic access to avoid TS errors if model missing.
    if (session?.user?.id && mapped.length > 0) {
      try {
        const pageIds = mapped.map((m: any) => m.id);
        const likes = await (prisma as any).pageLike.findMany({
          where: { pageId: { in: pageIds }, userId: session.user.id },
          select: { pageId: true },
        });
        const likedSet = new Set(likes.map((l: any) => l.pageId));
        mapped = mapped.map((m: any) => ({ ...m, isLiked: likedSet.has(m.id) }));
      } catch (e) {
        // If pageLike model doesn't exist or query fails, ignore and continue without isLiked
        mapped = mapped.map((m: any) => ({ ...m, isLiked: false }));
      }
    } else {
      mapped = mapped.map((m: any) => ({ ...m, isLiked: false }));
    }

    return NextResponse.json(mapped);
  } catch (error) {
    console.error('Error fetching pages:', error);
    // Check if it's a database connection error
    if (error instanceof Error) {
      if (error.message.includes('P1001') || error.message.includes('Can\'t reach database')) {
        console.warn('Database connection error - returning empty array');
        return NextResponse.json([], { status: 200 });
      }
    }
    // For other errors, also return empty array to maintain functionality
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { name, description, image, category } = body;
    if (!name) return NextResponse.json({ error: 'Page name required' }, { status: 400 });

    // Create the page and assign the current user as admin and member
    const page = await prisma.page.create({
      data: {
        name,
        description,
        image,
        category,
        admins: {
          create: [{ userId: session.user.id, role: 'admin' }],
        },
        members: {
          create: [{ userId: session.user.id, role: 'admin' }],
        },
      },
      include: { admins: true, members: true },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (error) {
    console.error('Error creating page:', error);
    // Check if it's a database connection error
    if (error instanceof Error) {
      if (error.message.includes('P1001') || error.message.includes('Can\'t reach database')) {
        return NextResponse.json({ error: 'Database temporarily unavailable' }, { status: 503 });
      }
    }
    return NextResponse.json({ error: 'Failed to create page' }, { status: 500 });
  }
}
