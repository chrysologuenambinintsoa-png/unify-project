import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/search - Search users, posts, and pages
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';

    if (!query || query.length < 2) {
      return NextResponse.json({
        users: [],
        posts: [],
        pages: [],
      });
    }

    const searchQuery = {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { fullName: { contains: query, mode: 'insensitive' } },
      ],
    };

    let results: any = {};

    if (type === 'all' || type === 'users') {
      results.users = await prisma.user.findMany({
        where: searchQuery,
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          isVerified: true,
        },
        take: 10,
      });
    }

    if (type === 'all' || type === 'posts') {
      results.posts = await prisma.post.findMany({
        where: {
          OR: [
            { content: { contains: query, mode: 'insensitive' } },
          ],
          isDeleted: false,
        },
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
        take: 10,
      });
    }

    if (type === 'all' || type === 'pages') {
      results.pages = await prisma.page.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
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
        },
        take: 10,
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error searching:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}
