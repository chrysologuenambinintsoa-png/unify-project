import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/messages/send - Send a message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content, mediaUrl, mediaType } = body;

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      );
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
        mediaUrl,
        mediaType,
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
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
