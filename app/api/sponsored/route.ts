import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/sponsored - Get active sponsored posts or all for admin
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 20);
    const offset = parseInt(searchParams.get('offset') || '0');
    const all = searchParams.get('all') === 'true'; // Get all for admin
    const now = new Date();

    if (all) {
      // Admin view: get all sponsored posts
      const sponsoredPosts = await prisma.sponsoredPost.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return NextResponse.json(sponsoredPosts);
    }

    // User view: get only active posts
    const sponsoredPosts = await prisma.sponsoredPost.findMany({
      where: {
        status: 'active',
        startDate: { lte: now },
        endDate: { gte: now },
      },
      orderBy: { startDate: 'desc' },
      skip: offset,
      take: limit,
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        image: true,
        link: true,
        advertiser: true,
        budget: true,
        spent: true,
        impressions: true,
        clicks: true,
        conversions: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(sponsoredPosts);
  } catch (error) {
    console.error('Error fetching sponsored posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sponsored posts' },
      { status: 500 }
    );
  }
}

// POST /api/sponsored - Create a new sponsored post (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      description,
      content,
      image,
      link,
      advertiser,
      budget,
      startDate,
      endDate,
      status = 'active',
    } = body;

    // Validate required fields
    if (!title || !description || !content || !advertiser || !budget || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const sponsoredPost = await prisma.sponsoredPost.create({
      data: {
        title,
        description,
        content,
        image: image || null,
        link: link || null,
        advertiser,
        budget: parseFloat(budget),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
      },
    });

    return NextResponse.json(sponsoredPost, { status: 201 });
  } catch (error) {
    console.error('Error creating sponsored post:', error);
    return NextResponse.json(
      { error: 'Failed to create sponsored post' },
      { status: 500 }
    );
  }
}

// PUT /api/sponsored - Update a sponsored post
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    // Parse numeric fields
    if (updateData.budget) updateData.budget = parseFloat(updateData.budget);
    if (updateData.spent) updateData.spent = parseFloat(updateData.spent);
    if (updateData.impressions) updateData.impressions = parseInt(updateData.impressions);
    if (updateData.clicks) updateData.clicks = parseInt(updateData.clicks);
    if (updateData.conversions) updateData.conversions = parseInt(updateData.conversions);
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const sponsoredPost = await prisma.sponsoredPost.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(sponsoredPost);
  } catch (error) {
    console.error('Error updating sponsored post:', error);
    return NextResponse.json(
      { error: 'Failed to update sponsored post' },
      { status: 500 }
    );
  }
}

// DELETE /api/sponsored - Delete a sponsored post
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.sponsoredPost.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Sponsored post deleted' });
  } catch (error) {
    console.error('Error deleting sponsored post:', error);
    return NextResponse.json(
      { error: 'Failed to delete sponsored post' },
      { status: 500 }
    );
  }
}
