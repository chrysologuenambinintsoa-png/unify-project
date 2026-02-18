import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// POST /api/messages/message-request - Send a message request to a non-friend
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { receiverId, content } = body;

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver ID and content are required' },
        { status: 400 }
      );
    }

    // Check if sender and receiver exist
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } }),
    ]);

    if (!sender) {
      return NextResponse.json(
        { error: 'Sender user not found. Please log in again.' },
        { status: 404 }
      );
    }

    if (!receiver) {
      return NextResponse.json(
        { error: 'Recipient not found' },
        { status: 404 }
      );
    }

    // Check if they're already friends
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { user1Id: session.user.id, user2Id: receiverId, status: 'accepted' },
          { user1Id: receiverId, user2Id: session.user.id, status: 'accepted' },
        ],
      },
    });

    if (friendship) {
      return NextResponse.json(
        { error: 'You are already friends' },
        { status: 400 }
      );
    }

    // Create message request
    const messageRequest = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
        isMessageRequest: true,
        messageRequestStatus: 'pending',
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

    return NextResponse.json(messageRequest, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error sending message request:', errorMessage);
    return NextResponse.json(
      { error: 'Failed to send message request', details: errorMessage },
      { status: 500 }
    );
  }
}

// PUT /api/messages/message-request - Accept or reject a message request
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { messageId, action } = body; // action: "accept" or "reject"

    if (!messageId || !['accept', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Message ID and valid action are required' },
        { status: 400 }
      );
    }

    // Get the message (select only needed fields for performance)
    // Use Promise.race to prevent hanging on slow database
    const message = await Promise.race([
      prisma.message.findUnique({
        where: { id: messageId },
        select: {
          id: true,
          senderId: true,
          receiverId: true,
          isMessageRequest: true,
          messageRequestStatus: true,
        },
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Database query timeout')), 10000)
      ),
    ]).catch(() => null) as any;

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Verify that current user is the receiver
    if (message.receiverId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    if (!message.isMessageRequest) {
      return NextResponse.json(
        { error: 'This is not a message request' },
        { status: 400 }
      );
    }

    // Update message request status
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        messageRequestStatus: action === 'accept' ? 'accepted' : 'rejected',
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

    // If accepted, create or update friendship (use upsert for optimization)
    if (action === 'accept') {
      // Ensure consistent user ordering: smaller ID first
      const [user1Id, user2Id] = message.senderId < message.receiverId 
        ? [message.senderId, message.receiverId]
        : [message.receiverId, message.senderId];

      // Upsert friendship: create if doesn't exist, update status if does
      await prisma.friendship.upsert({
        where: {
          user1Id_user2Id: {
            user1Id,
            user2Id,
          },
        },
        update: {
          status: 'accepted',
        },
        create: {
          user1Id,
          user2Id,
          status: 'accepted',
        },
      });
    }

    return NextResponse.json(updatedMessage, { status: 200 });
  } catch (error) {
    console.error('Error processing message request:', error);
    return NextResponse.json(
      { error: 'Failed to process message request' },
      { status: 500 }
    );
  }
}
