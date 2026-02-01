import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { publish } from '@/app/api/realtime/broadcast';

// POST /api/stories/[storyId]/messages - send a message to the story owner
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ storyId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storyId } = await params;
    let body;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error('Invalid JSON body for story message:', parseError);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { message, imageUrl } = body as { message?: string; imageUrl?: string };

    // Validate story
    const story = await prisma.story.findUnique({ where: { id: storyId } });
    if (!story) return NextResponse.json({ error: 'Story not found' }, { status: 404 });

    // Determine receiver (owner of the story)
    const receiverId = story.userId;

    // Compose message payload. If imageUrl provided use it, otherwise attach story.imageUrl
    const imageToSend = imageUrl || story.imageUrl || undefined;

    const created = await prisma.message.create({
      data: {
        content: message || '',
        image: imageToSend,
        senderId: session.user.id,
        receiverId,
      },
    });

    // Create a notification for the receiver so they see the incoming message
    try {
      await prisma.notification.create({
        data: {
          type: 'message',
          title: 'Nouveau message',
          content: message ? message.slice(0, 200) : 'Vous avez reçu un message',
          url: `/messages/${created.id}`,
          userId: receiverId,
          actorId: session.user.id,
        },
      });
    } catch (notifErr) {
      console.error('Failed to create notification for story message:', notifErr);
    }

    // Broadcast message to realtime subscribers (so owner client can receive immediately)
    try {
      publish('story-message', { storyId, message: created, senderId: session.user.id });
    } catch (e) {}

    // Optionally: create a notification for the receiver (omitted here)

    return NextResponse.json({ success: true, message: created }, { status: 201 });
  } catch (error) {
    console.error('Error creating story message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
