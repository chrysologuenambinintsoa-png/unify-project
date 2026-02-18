import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/pages/[pageId]
export async function GET(req: NextRequest, { params }: { params: Promise<{ pageId: string }> }) {
  try {
    const { pageId } = await params;
    const page = await prisma.page.findUnique({
      where: { id: pageId },
      include: {
        admins: {
          include: {
            user: { select: { id: true, username: true, fullName: true, avatar: true } },
          },
        },
        members: {
          include: {
            user: { select: { id: true, username: true, fullName: true, avatar: true } },
          },
        },
        posts: { 
          orderBy: { createdAt: 'desc' }, 
          take: 20 
        },
        _count: {
          select: {
            members: true,
            admins: true,
            posts: true,
          },
        },
      },
    });
    if (!page) return NextResponse.json({ error: 'Page not found' }, { status: 404 });

    // Enrich posts with author information
    const postsWithAuthors = await Promise.all(
      (page.posts || []).map(async (post: any) => {
        const author = await prisma.user.findUnique({
          where: { id: post.authorId },
          select: { id: true, username: true, fullName: true, avatar: true },
        });
        return {
          ...post,
          author: author || { id: post.authorId, username: 'Unknown', fullName: 'Unknown User', avatar: null },
        };
      })
    );

    // Get owner from first admin
    const pageData = page as any;
    const ownerAdmin = pageData.admins && pageData.admins.length > 0 ? pageData.admins[0] : null;

    return NextResponse.json({
      ...page,
      posts: postsWithAuthors,
      owner: ownerAdmin?.user || {
        id: 'unknown',
        username: 'Unknown',
        fullName: 'Unknown',
        avatar: null,
      },
    });
  } catch (error) {
    console.error('Error fetching page:', error);
    return NextResponse.json({ error: 'Failed to fetch page' }, { status: 500 });
  }
}

// PATCH /api/pages/[pageId]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ pageId: string }> }) {
  try {
    const { pageId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify user is admin
    const isAdmin = await (prisma as any).pageAdmin.findFirst({
      where: { pageId, userId: session.user.id },
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only page admins can update pages' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, description, category, visibility, coverImage } = body;

    // Only allow updating specific fields
    const updateData: any = {};
    ['name', 'description', 'category', 'visibility', 'coverImage'].forEach((field) => {
      if (field in body) {
        updateData[field] = body[field];
      }
    });

    const updated = await (prisma as any).page.update({
      where: { id: pageId },
      data: updateData,
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating page:', error);
    return NextResponse.json({ error: 'Failed to update page' }, { status: 500 });
  }
}

// DELETE /api/pages/[pageId]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ pageId: string }> }) {
  try {
    const { pageId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify user is admin
    const isAdmin = await (prisma as any).pageAdmin.findFirst({
      where: { pageId, userId: session.user.id },
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only page admins can delete pages' },
        { status: 403 }
      );
    }

    const deleted = await (prisma as any).page.delete({
      where: { id: pageId },
    });

    return NextResponse.json({
      success: true,
      message: 'Page deleted successfully',
      page: deleted,
    });
  } catch (error) {
    console.error('Error deleting page:', error);
    return NextResponse.json({ error: 'Failed to delete page' }, { status: 500 });
  }
}
