import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/messages - Get messages for a user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const conversationUserId = searchParams.get('userId');

    if (conversationUserId) {
      // Get conversation with specific user
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            {
              senderId: session.user.id,
              receiverId: conversationUserId,
            },
            {
              senderId: conversationUserId,
              receiverId: session.user.id,
            },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          reactions: {
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
          },
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      return NextResponse.json(messages);
    } else {
      // Get all conversations
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
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 100,
      });

      // Group by conversation (other user)
      const conversationsMap = new Map();

      messages.forEach((message) => {
        const otherUser = message.senderId === session.user.id ? message.receiver : message.sender;
        const key = otherUser.id;

        if (!conversationsMap.has(key)) {
          conversationsMap.set(key, {
            user: otherUser,
            lastMessage: message,
            unread: 0, // TODO: implement unread count
          });
        }
      });

      const conversations = Array.from(conversationsMap.values()).map((conv) => ({
        id: conv.user.id,
        user: conv.user,
        lastMessage: conv.lastMessage.content,
        time: conv.lastMessage.createdAt.toISOString(),
        unread: conv.unread,
      }));

      return NextResponse.json({ conversations });
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST /api/messages - Send a message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content, image, document } = body;

    if (!receiverId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Receiver and content are required' },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        receiverId,
        content,
        image,
        document,
        senderId: session.user.id,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            fullName: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json(
      { error: 'Failed to create message' },
      { status: 500 }
    );
  }
}