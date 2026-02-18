import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { generateAvatarUrl } from '@/lib/avatar-utils';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all conversations (unique users the current user has exchanged messages with)
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
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
        reactions: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Group by conversation partner
    const conversationsMap = new Map();
    messages.forEach((message) => {
      const partnerId = message.senderId === session.user.id ? message.receiverId : message.senderId;
      const partner = message.senderId === session.user.id ? message.receiver : message.sender;

      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          id: partnerId,
          name: partner.fullName || 'Unknown User',
          avatar: generateAvatarUrl(partner.avatar, partner.fullName, partner.id, null),
          email: partner.email,
          lastMessage: message.content || '📷 Photo',
          lastMessageTime: message.createdAt.toISOString(),
          messages: [],
          unreadCount: 0,
        });
      }

      const conversation = conversationsMap.get(partnerId);
      conversation.messages.push(message);

      // Count unread messages
      if (message.receiverId === session.user.id && !message.isRead) {
        conversation.unreadCount++;
      }
    });

    const conversations = Array.from(conversationsMap.values());

    return NextResponse.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
