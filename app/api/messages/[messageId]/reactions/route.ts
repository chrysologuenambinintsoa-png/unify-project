import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/messages/[messageId]/reactions - list reactions for a message
export async function GET(request: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const { messageId } = await params;
    const reactions = await prisma.messageReaction.findMany({
      where: { messageId },
      include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const grouped = reactions.reduce((acc: any[], r: any) => {
      const ex = acc.find(a => a.emoji === r.emoji);
      if (ex) { ex.count += 1; ex.users.push(r.user); }
      else acc.push({ emoji: r.emoji, count: 1, users: [r.user] });
      return acc;
    }, []);

    return NextResponse.json({ total: reactions.length, reactions: grouped, all: reactions });
  } catch (err) {
    console.error('Error listing message reactions', err);
    return NextResponse.json({ error: 'Failed to list reactions' }, { status: 500 });
  }
}

// POST /api/messages/[messageId]/reactions - toggle/add reaction for current user
export async function POST(request: NextRequest, { params }: { params: Promise<{ messageId: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { messageId } = await params;
    const body = await request.json().catch(() => ({}));
    const { emoji } = body;
    if (!emoji) return NextResponse.json({ error: 'Emoji required' }, { status: 400 });

    const existing = await prisma.messageReaction.findUnique({ where: { messageId_userId: { messageId, userId: session.user.id } } });
    if (existing) {
      if (existing.emoji === emoji) {
        // remove (toggle)
        await prisma.messageReaction.delete({ where: { id: existing.id } });
        return NextResponse.json({ message: 'removed', action: 'removed' });
      }
      // update
      const updated = await prisma.messageReaction.update({ where: { id: existing.id }, data: { emoji }, include: { user: true } });
      return NextResponse.json({ message: 'updated', action: 'updated', reaction: updated });
    }

    const created = await prisma.messageReaction.create({ data: { messageId, userId: session.user.id, emoji }, include: { user: true } });
    return NextResponse.json({ message: 'added', action: 'added', reaction: created }, { status: 201 });
  } catch (err) {
    console.error('Error toggling message reaction', err);
    return NextResponse.json({ error: 'Failed to react' }, { status: 500 });
  }
}

// DELETE not required (POST toggles)
