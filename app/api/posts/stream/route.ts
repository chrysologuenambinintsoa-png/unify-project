import { NextRequest } from 'next/server';
import { subscribeToPostEvents } from '@/lib/postEvents';

// Server-Sent Events endpoint for posts
export async function GET(request: NextRequest) {
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();

  const send = async (data: any) => {
    try {
      const payload = `data: ${JSON.stringify(data)}\n\n`;
      const enc = new TextEncoder();
      await writer.write(enc.encode(payload));
    } catch (e) {
      console.warn('SSE send error', e);
    }
  };

  const unsubscribe = subscribeToPostEvents((ev) => {
    send(ev);
  });

  // keep-alive ping every 15s
  const keepAlive = setInterval(() => {
    send({ type: 'ping', payload: {} });
  }, 15000);

  request.signal.addEventListener('abort', () => {
    clearInterval(keepAlive);
    unsubscribe();
    writer.close().catch(() => {});
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
