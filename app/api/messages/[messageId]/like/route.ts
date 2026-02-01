import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/messages/[messageId]/like
 * Like or unlike a message
 */
export async function POST(
  request: NextRequest,
  context: any
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // In some Next.js versions `context.params` can be a Promise-like value.
    let params: any = context?.params;
    if (params && typeof params.then === 'function') {
      params = await params;
    }
    const { messageId } = params || {};

    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    // Fetch the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Check if user is sender or receiver
    if (message.senderId !== session.user.id && message.receiverId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // For now, we'll store likes using the reactions table with a special emoji
    // Check if user already liked this message
    const existingLike = await (prisma as any).messageReaction?.findFirst({
      where: {
        messageId,
        userId: session.user.id,
        emoji: '❤️',
      },
    });

    if (existingLike) {
      // Unlike
      await (prisma as any).messageReaction?.delete({
        where: { id: existingLike.id },
      });

      return NextResponse.json({
        success: true,
        action: 'removed',
        message: 'Message unliked',
      });
    } else {
      // Like
      const like = await (prisma as any).messageReaction?.create({
        data: {
          messageId,
          userId: session.user.id,
          emoji: '❤️',
        },
      });

      return NextResponse.json({
        success: true,
        action: 'added',
        like,
      });
    }
  } catch (error) {
    console.error('Error liking message:', error);
    return NextResponse.json(
      { error: 'Failed to like message' },
      { status: 500 }
    );
  }
}
