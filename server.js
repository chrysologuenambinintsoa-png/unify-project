const { createServer } = require('http');
const next = require('next');
const { WebSocketServer } = require('ws');

const port = Number(process.env.PORT || 3000);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    handle(req, res);
  });

  const wss = new WebSocketServer({ noServer: true });

  // Broadcast helper
  const clients = new Set();
  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });

  // integrate with in-process postEvents
  try {
    const { subscribeToPostEvents } = require('./lib/postEvents');
    subscribeToPostEvents((ev) => {
      const msg = JSON.stringify(ev);
      for (const c of clients) {
        try {
          c.send(msg);
        } catch (e) {}
      }
    });
  } catch (e) {
    console.warn('postEvents integration failed', e);
  }

  server.on('upgrade', (request, socket, head) => {
    // Only handle ws upgrades to our path
    const { url } = request;
    if (url && url.startsWith('/ws')) {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  server.listen(port, () => {
    console.log(`Custom Next server with WS listening on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
