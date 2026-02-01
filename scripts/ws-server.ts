import { WebSocketServer } from 'ws';
import { subscribeToPostEvents } from '../lib/postEvents';

const port = Number(process.env.WS_PORT || 4000);

const wss = new WebSocketServer({ port });
console.log(`WebSocket server listening on ws://localhost:${port}`);

wss.on('connection', (ws) => {
  console.log('WS client connected');

  const send = (obj: any) => {
    try {
      ws.send(JSON.stringify(obj));
    } catch (e) {
      // ignore
    }
  };

  const unsubscribe = subscribeToPostEvents((ev) => send(ev));

  // optional ping to keep connection alive
  const ping = setInterval(() => {
    try {
      ws.send(JSON.stringify({ type: 'ping' }));
    } catch (e) {}
  }, 15000);

  ws.on('close', () => {
    clearInterval(ping);
    unsubscribe();
    console.log('WS client disconnected');
  });

  ws.on('message', (msg) => {
    // ignore client messages for now; could be used for presence
  });
});
