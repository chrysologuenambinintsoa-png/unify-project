import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { publish } from '@/app/api/realtime/broadcast';

// GET /api/stories/[storyId]/views - Get all views of a story
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const { storyId } = await params;

    // Verify story exists
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Get all views for this story
    const views = await prisma.storyView.findMany({
      where: {
        storyId: storyId,
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            isVerified: true,
          },
        },
      },
      orderBy: {
        viewedAt: 'desc',
      },
    });

    return NextResponse.json({
      total: views.length,
      views,
    });
  } catch (error) {
    console.error('Error fetching story views:', error);
    return NextResponse.json(
      { error: 'Failed to fetch views' },
      { status: 500 }
    );
  }
}

// POST /api/stories/[storyId]/views - Mark story as viewed
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storyId } = await params;

    // Verify story exists
    const story = await prisma.story.findUnique({
      where: { id: storyId },
    });

    if (!story) {
      return NextResponse.json(
        { error: 'Story not found' },
        { status: 404 }
      );
    }

    // Check if story is still valid
    if (story.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Story has expired' },
        { status: 410 }
      );
    }

    // Check if already viewed by this user
    const existingView = await prisma.storyView.findUnique({
      where: {
        storyId_userId: {
          storyId: storyId,
          userId: session.user.id,
        },
      },
    });

    if (existingView) {
      return NextResponse.json(
        { message: 'Story already viewed', action: 'already_viewed' },
        { status: 200 }
      );
    }

    // Create view record
    const view = await prisma.storyView.create({
      data: {
        storyId: storyId,
        userId: session.user.id,
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
    });

    // Broadcast view event to realtime subscribers
    try {
      publish('story-view', { storyId, view });
    } catch (e) {}

    return NextResponse.json(
      {
        message: 'View recorded',
        action: 'viewed',
        view,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error recording story view:', error);
    return NextResponse.json(
      { error: 'Failed to record view' },
      { status: 500 }
    );
  }
}
