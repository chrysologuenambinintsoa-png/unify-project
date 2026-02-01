import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/messages/[messageId] - Mark message as read
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await context.params;

    const message = await prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json(
      { error: 'Failed to update message' },
      { status: 500 }
    );
  }
}

// DELETE /api/messages/[messageId] - Delete a message
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ messageId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = await context.params;
    const url = new URL(request.url);
    const scope = url.searchParams.get('scope') || 'me';

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    if (scope === 'everyone') {
      // allow delete for everyone if sender or receiver
      if (message.senderId !== session.user.id && message.receiverId !== session.user.id) {
        return NextResponse.json({ error: 'Not authorized to delete for everyone' }, { status: 403 });
      }
      await prisma.message.delete({ where: { id: messageId } });
      return NextResponse.json({ success: true, scope: 'everyone' });
    }

    // default: hide for me (client will remove locally) — store in in-memory hide store
    try {
      const { hideForUser } = await import('@/app/api/messages/hideStore');
      hideForUser(session.user.id, messageId);
      return NextResponse.json({ success: true, scope: 'me' });
    } catch (e) {
      return NextResponse.json({ error: 'Failed to hide message' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
