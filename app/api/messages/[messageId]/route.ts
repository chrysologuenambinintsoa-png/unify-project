import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// PATCH /api/messages/[messageId] - Mark message as read or edit content
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

    // Get the message first to check ownership
    const existingMessage = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existingMessage) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if request body has content update
    let body: { content?: string } = {};
    try {
      body = await request.json();
    } catch (e) {
      // No body provided, default to marking as read
    }

    const updateData: any = {};

    // If content is provided, verify sender and update
    if (body.content && typeof body.content === 'string') {
      if (existingMessage.senderId !== session.user.id) {
        return NextResponse.json(
          { error: 'Only message sender can edit' },
          { status: 403 }
        );
      }
      updateData.content = body.content.trim();
    }

    // Always mark as read for the user reading it
    updateData.isRead = true;

    const message = await prisma.message.update({
      where: { id: messageId },
      data: updateData,
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

    // Check ownership
    if (message.senderId !== session.user.id && message.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Not authorized to delete this message' }, { status: 403 });
    }

    if (scope === 'everyone') {
      // Delete for everyone - only sender can do this
      if (message.senderId !== session.user.id) {
        return NextResponse.json(
          { error: 'Only sender can delete for everyone' },
          { status: 403 }
        );
      }
      
      // For now, treat "delete for everyone" as "delete for me"
      // until the deletedForEveryone column is available in the database
      await prisma.hiddenMessage.upsert({
        where: {
          messageId_userId: {
            messageId: messageId,
            userId: session.user.id,
          },
        },
        create: {
          messageId: messageId,
          userId: session.user.id,
        },
        update: {},
      });

      return NextResponse.json({ success: true, scope: 'everyone_fallback' });
    } else {
      // Delete for me only - add to HiddenMessage table
      await prisma.hiddenMessage.upsert({
        where: {
          messageId_userId: {
            messageId: messageId,
            userId: session.user.id,
          },
        },
        create: {
          messageId: messageId,
          userId: session.user.id,
        },
        update: {},
      });

      return NextResponse.json({ success: true, scope: 'me' });
    }
  } catch (error) {
    console.error('Error deleting message:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
