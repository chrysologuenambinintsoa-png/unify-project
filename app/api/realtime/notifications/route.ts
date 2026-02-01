import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { addClient, removeClient } from '@/app/api/realtime/broadcast';

// GET /api/realtime/notifications - Server-Sent Events stream for real-time notifications
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });

    // Create a response with custom ReadableStream
    const stream = new ReadableStream({
      start(controller) {
        // Send a comment to keep the connection alive
        const clientId = `${userId}_${Date.now()}`;
        addClient(clientId, controller, userId);

        // Send initial message
        controller.enqueue(new TextEncoder().encode(`:connected for user ${userId}\n\n`));

        // Keep connection alive with heartbeat
        const heartbeat = setInterval(() => {
          try {
            controller.enqueue(new TextEncoder().encode(`:heartbeat\n\n`));
          } catch (e) {
            clearInterval(heartbeat);
            removeClient(clientId);
          }
        }, 30000);

        return () => {
          clearInterval(heartbeat);
          removeClient(clientId);
        };
      },
    });

    return new Response(stream, { headers });
  } catch (error) {
    console.error('Error in notifications SSE:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
