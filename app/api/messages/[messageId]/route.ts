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

    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message || message.senderId !== session.user.id) {
      return NextResponse.json(
        { error: 'Not authorized to delete this message' },
        { status: 403 }
      );
    }

    await prisma.message.delete({
      where: { id: messageId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
