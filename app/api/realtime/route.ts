import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { addClient, removeClient } from './broadcast';

export async function GET(req: Request) {
  const { readable, writable } = new TransformStream();
  // This route will not use the TransformStream mechanism in Next's runtime directly.
  // Instead, we attach to the underlying Node response using a workaround: return a Response with a body that's a stream.

  const id = uuidv4();

  const headers = new Headers();
  headers.set('Content-Type', 'text/event-stream');
  headers.set('Cache-Control', 'no-cache');
  headers.set('Connection', 'keep-alive');

  // Create a PassThrough-like stream node-side by using a stream.Readable via Response stream
  const stream = new ReadableStream({
    start(controller) {
      // keep controller open; we don't push here — server will write via addClient's res which we map
    }
  });

  // For Node adapter, access req as any to get the underlying res. But in Next's app router this is not supported.
  // Instead, we will use a simple Response and rely on our broadcast.addClient to be passed a "res" that is a writer.

  // Create an object implementing write by wrapping a TextEncoderStream to pass to broadcast
  const encoder = new TextEncoder();
  const streamController = (globalThis as any).__sse_streams__ ||= new Map();
  const queue: any[] = [];
  const resWriter = {
    write(chunk: string) {
      try {
        // store chunks in global map keyed by id; consumer on server side won't read back — but our broadcast.publish will call res.write which we map to pushing to a map
        queue.push(chunk);
      } catch (e) {}
    },
    end() {
      // noop
    }
  };

  // Add client with our writer
  addClient(id, resWriter as any);

  // Return a long-lived response that periodically flushes queued chunks
  const body = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const interval = setInterval(() => {
        while (queue.length > 0) {
          const ch = queue.shift();
          controller.enqueue(encoder.encode(ch));
        }
      }, 250);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        removeClient(id);
        controller.close();
      });
    }
  });

  return new Response(body, { status: 200, headers });
}
