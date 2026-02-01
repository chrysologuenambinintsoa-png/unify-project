import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/messages/[messageId]/attachment
 * Download or view a message attachment
 */
export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { messageId } = context?.params || {};

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

    // Handle document attachment
    if (message.document) {
      // Check if it's a base64 string or URL
      if (message.document.startsWith('data:')) {
        // Base64 encoded document
        const base64Data = message.document.split(',')[1];
        const mimeType = message.document.match(/data:([^;]+)/)?.[1] || 'application/octet-stream';
        const buffer = Buffer.from(base64Data, 'base64');

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="document-${messageId}"`,
          },
        });
      } else {
        // URL reference - redirect to it
        return NextResponse.redirect(message.document);
      }
    }

    // Handle image attachment
    if (message.image) {
      if (message.image.startsWith('data:')) {
        // Base64 encoded image
        const base64Data = message.image.split(',')[1];
        const mimeType = message.image.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
        const buffer = Buffer.from(base64Data, 'base64');

        return new NextResponse(buffer, {
          headers: {
            'Content-Type': mimeType,
            'Content-Disposition': `inline; filename="image-${messageId}"`,
          },
        });
      } else {
        // URL reference - redirect to it
        return NextResponse.redirect(message.image);
      }
    }

    return NextResponse.json(
      { error: 'No attachment found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching attachment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attachment' },
      { status: 500 }
    );
  }
}
