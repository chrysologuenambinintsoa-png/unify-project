import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/pages/[pageId]/members - List page members
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const { pageId } = await params;

    const members = await (prisma as any).pageMember.findMany({
      where: { pageId },
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
      orderBy: { joinedAt: 'desc' },
    });

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}

// POST /api/pages/[pageId]/members - Add member
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId } = await params;
    const body = await request.json();
    const { userId, role = 'member' } = body;

    // Verify user is admin of page
    const isAdmin = await (prisma as any).pageAdmin.findFirst({
      where: {
        pageId,
        userId: session.user.id,
      },
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can add members' },
        { status: 403 }
      );
    }

    // Check if already member
    const existing = await (prisma as any).pageMember.findFirst({
      where: { pageId, userId },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'User is already a member' },
        { status: 400 }
      );
    }

    // Add member
    const member = await (prisma as any).pageMember.create({
      data: {
        pageId,
        userId,
        role,
      },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
      },
    });

    return NextResponse.json(member, { status: 201 });
  } catch (error) {
    console.error('Error adding member:', error);
    return NextResponse.json(
      { error: 'Failed to add member' },
      { status: 500 }
    );
  }
}

// PATCH /api/pages/[pageId]/members/[memberId] - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId } = await params;
    const body = await request.json();
    const { memberId, role } = body;

    // Verify user is admin
    const isAdmin = await (prisma as any).pageAdmin.findFirst({
      where: { pageId, userId: session.user.id },
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can update members' },
        { status: 403 }
      );
    }

    const updated = await (prisma as any).pageMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: { id: true, username: true, fullName: true, avatar: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating member:', error);
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

// DELETE /api/pages/[pageId]/members/[memberId] - Remove member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ pageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { pageId } = await params;
    const { memberId } = await request.json();

    // Verify user is admin
    const isAdmin = await (prisma as any).pageAdmin.findFirst({
      where: { pageId, userId: session.user.id },
    });

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can remove members' },
        { status: 403 }
      );
    }

    await (prisma as any).pageMember.delete({
      where: { id: memberId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
