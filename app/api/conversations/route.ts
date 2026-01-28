import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/conversations - Get all conversations for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const conversations = await prisma.message.groupBy({
      by: ['senderId', 'receiverId'],
      where: {
        OR: [
          { senderId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      orderBy: {
        _max: {
          createdAt: 'desc',
        },
      },
    });

    const conversationData = await Promise.all(
      conversations.map(async (conv) => {
        const otherUserId = conv.senderId === session.user.id ? conv.receiverId : conv.senderId;

        const lastMessage = await prisma.message.findFirst({
          where: {
            OR: [
              { senderId: session.user.id, receiverId: otherUserId },
              { senderId: otherUserId, receiverId: session.user.id },
            ],
          },
          orderBy: {
            createdAt: 'desc',
          },
        });

        const user = await prisma.user.findUnique({
          where: { id: otherUserId },
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
            isVerified: true,
          },
        });

        return {
          user,
          lastMessage,
          unreadCount: lastMessage
            ? await prisma.message.count({
                where: {
                  senderId: otherUserId,
                  receiverId: session.user.id,
                  isRead: false,
                },
              })
            : 0,
        };
      })
    );

    return NextResponse.json(conversationData);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
