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

  // Live room management (resolve path via __dirname for deployments where CWD differs)
  const path = require('path');
  let createRoom, getRoom, listRooms, joinRoom, leaveRoom, getParticipants;
  try {
    const liveRoomsModule = require(path.join(__dirname, 'lib', 'liveRooms'));
    ({ createRoom, getRoom, listRooms, joinRoom, leaveRoom, getParticipants } = liveRoomsModule);
  } catch (err) {
    // Fallback to relative require and surface a clear log for deployment debugging
    console.error('Could not require lib/liveRooms via __dirname, falling back to relative require:', err && err.message);
    ({ createRoom, getRoom, listRooms, joinRoom, leaveRoom, getParticipants } = require('./lib/liveRooms'));
  }

  wss.on('connection', (ws, request) => {
    console.log('[WS] New connection established, setting up handlers');
    clients.add(ws);
    ws._joinedRooms = new Set();

    // Send initial room list immediately upon connection
    try {
      const initialData = { type: 'roomsList', rooms: listRooms() };
      ws.send(JSON.stringify(initialData));
      console.log('[WS] Sent initial roomsList on connection');
    } catch (e) {
      console.error('[WS] Failed to send initial roomsList:', e);
    }

    ws.on('message', (raw) => {
      try {
        console.log('[WS] Message received:', raw.toString().substring(0, 100));
        const msg = JSON.parse(raw.toString());
        const { type, roomId, payload, to } = msg;
        console.log('[WS] Parsed message type:', type);

        switch (type) {
          case 'listRooms': {
            const data = { type: 'roomsList', rooms: listRooms() };
            ws.send(JSON.stringify(data));
            break;
          }
          case 'createRoom': {
            const room = createRoom({ id: roomId, title: payload?.title, hostId: payload?.hostId });
            const data = { type: 'roomCreated', room: { id: room.id, title: room.title } };
            ws.send(JSON.stringify(data));
            break;
          }
          case 'joinRoom': {
            const participant = payload || { id: null, name: 'Anon', role: 'participant' };
            const room = getRoom(roomId);
            if (room) {
              joinRoom(roomId, ws, participant);
              ws._joinedRooms.add(roomId);
              // send current participants list to the joining socket
              try {
                const pList = getParticipants(roomId);
                ws.send(JSON.stringify({ type: 'participantsList', roomId, participants: pList }));
              } catch (e) {}
              // notify existing participants
              for (const [s, p] of room.participants) {
                if (s !== ws) {
                  try { s.send(JSON.stringify({ type: 'participantJoined', roomId, participant })); } catch (e) {}
                }
              }
              ws.send(JSON.stringify({ type: 'joinedRoom', roomId, room: { id: room.id, title: room.title } }));

              // If the joining participant is a viewer, notify hosts/streamers so they create offers to this viewer
              if (participant.role === 'viewer') {
                for (const [s, p] of room.participants) {
                  if (p && p.role && (p.role === 'host' || p.role === 'participant') && s !== ws) {
                    try { s.send(JSON.stringify({ type: 'viewerJoined', roomId, payload: { participant } })); } catch (e) {}
                  }
                }
              }
            } else {
              ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
            }
            break;
          }
          case 'leaveRoom': {
            const room = getRoom(roomId);
            if (room) {
              leaveRoom(roomId, ws);
              ws._joinedRooms.delete(roomId);
              for (const [s] of room.participants) {
                s.send(JSON.stringify({ type: 'participantLeft', roomId, payload }));
              }
            }
            break;
          }
          // Signaling and real-time events: forward to target or broadcast to room
          case 'offer':
          case 'answer':
          case 'ice': {
            // if 'to' provided, forward only to that socket (match by participant id)
            const room = getRoom(roomId);
            if (!room) break;
            for (const [s, p] of room.participants) {
              if (to && p && p.id === to) {
                s.send(JSON.stringify(msg));
                break;
              }
            }
            break;
          }
          case 'comment':
          case 'reaction': {
            // broadcast to all participants in the room
            const room = getRoom(roomId);
            if (!room) break;
            for (const [s] of room.participants) {
              try { s.send(JSON.stringify(msg)); } catch (e) {}
            }
            break;
          }
          default: {
            // unknown message - ignore
            break;
          }
        }
      } catch (err) {
        console.error('WS message error', err);
      }
    });

    ws.on('close', () => {
      console.log('[WS] Connection closed');
      // cleanup from rooms
      for (const roomId of Array.from(ws._joinedRooms || [])) {
        try { leaveRoom(roomId, ws); } catch (e) {}
      }
      clients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS] WebSocket error:', err);
    });
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
    console.log('[WS] Upgrade request:', { url, hasHead: !!head });
    if (url && url.startsWith('/ws')) {
      console.log('[WS] Handling upgrade for /ws path');
      wss.handleUpgrade(request, socket, head, (ws) => {
        console.log('[WS] Connection established');
        wss.emit('connection', ws, request);
      });
    } else {
      // Do not destroy other upgrade sockets (e.g. Next's HMR websocket).
      // Let other upgrade listeners (registered by Next) handle them.
      console.log('[WS] Ignoring upgrade for path:', url);
      return;
    }
  });

  server.listen(port, () => {
    console.log(`Custom Next server with WS listening on http://localhost:${port}`);
  });
}).catch((err) => {
  console.error('Failed to start server', err);
  process.exit(1);
});
