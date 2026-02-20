import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateAvatarUrl } from '@/lib/avatar-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;

    // Fetch all messages between current user and the specified user
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id, receiverId: userId },
          { senderId: userId, receiverId: session.user.id },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            email: true,
          },
        },
        receiver: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
            email: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Get hidden messages for current user
    const hiddenMessages = await prisma.hiddenMessage.findMany({
      where: {
        userId: session.user.id,
      },
      select: {
        messageId: true,
      },
    });

    const hiddenMessageIds = new Set(hiddenMessages.map(h => h.messageId));

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: userId,
        receiverId: session.user.id,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Format messages for frontend - exclude hidden messages but include message requests
    const formattedMessages = messages
      .filter(msg => !hiddenMessageIds.has(msg.id))
      .map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        senderName: msg.sender.fullName || 'Unknown User',
        senderAvatar: generateAvatarUrl(msg.sender.avatar, msg.sender.fullName, msg.sender.id, null),
        content: msg.content || undefined,
        image: msg.image || undefined,
        file: msg.document ? { name: 'Document', size: 0, url: msg.document } : undefined,
        timestamp: msg.createdAt,
        isRead: msg.isRead,
        isMessageRequest: msg.isMessageRequest,
        messageRequestStatus: msg.messageRequestStatus,
        sender: {
          id: msg.sender.id,
          username: msg.sender.id, // Use id as fallback since username isn't selected
          fullName: msg.sender.fullName || 'Unknown User',
          avatar: generateAvatarUrl(msg.sender.avatar, msg.sender.fullName, msg.sender.id, null),
        },
        reactions: msg.reactions.reduce((acc, reaction) => {
          const existingReaction = acc.find((r) => r.emoji === reaction.emoji);
          if (existingReaction) {
            existingReaction.count++;
          } else {
            acc.push({ emoji: reaction.emoji, count: 1 });
          }
          return acc;
        }, [] as Array<{ emoji: string; count: number }>),
      }));

    return NextResponse.json(formattedMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
