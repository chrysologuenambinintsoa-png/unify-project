import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET /api/groups/[groupId]
export async function GET(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params;
    const session = await getServerSession(authOptions);

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        members: { include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } }, take: 5 },
        posts: { 
          orderBy: { createdAt: 'desc' }, 
          take: 20 
        },
        _count: { select: { members: true, posts: true } },
      },
    });
    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    
    // Enrich posts with author information
    const postsWithAuthors = await Promise.all(
      (group.posts || []).map(async (post: any) => {
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
    
    // Fetch admin user data
    const admin = await prisma.user.findUnique({
      where: { id: group.adminId },
      select: {
        id: true,
        username: true,
        fullName: true,
        avatar: true,
      },
    });

    // Check if current user is a member
    let isMember = false;
    if (session?.user?.id) {
      const memberCheck = await prisma.groupMember.findFirst({
        where: {
          groupId: groupId,
          userId: session.user.id,
        },
      });
      isMember = !!memberCheck;
    }

    return NextResponse.json({
      ...group,
      posts: postsWithAuthors,
      owner: admin || {
        id: group.adminId,
        username: 'Unknown',
        fullName: 'Unknown',
        avatar: null,
      },
      isMember,
    });
  } catch (error) {
    console.error('Error fetching group:', error);
    return NextResponse.json({ error: 'Failed to fetch group' }, { status: 500 });
  }
}

// PATCH /api/groups/[groupId]
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get group and verify admin
    const group = await (prisma as any).group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.adminId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only group admins can update groups' },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Only allow updating specific fields
    const allowedUpdates = ['name', 'description', 'visibility', 'isPrivate'];
    const updateData: any = {};

    allowedUpdates.forEach((field) => {
      if (field in body) {
        updateData[field] = body[field];
      }
    });

    const updated = await (prisma as any).group.update({
      where: { id: groupId },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating group:', error);
    return NextResponse.json({ error: 'Failed to update group' }, { status: 500 });
  }
}

// DELETE /api/groups/[groupId]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ groupId: string }> }) {
  try {
    const { groupId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Get group and verify admin
    const group = await (prisma as any).group.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    if (group.adminId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only group admins can delete groups' },
        { status: 403 }
      );
    }

    const deleted = await (prisma as any).group.delete({
      where: { id: groupId },
    });

    return NextResponse.json({
      success: true,
      message: 'Group deleted successfully',
      group: deleted,
    });
  } catch (error) {
    console.error('Error deleting group:', error);
    return NextResponse.json({ error: 'Failed to delete group' }, { status: 500 });
  }
}
