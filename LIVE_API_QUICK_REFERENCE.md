# Live API Routes Summary

## Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| **GET** | `/api/live` | List all active rooms |
| **POST** | `/api/live` | Create a new room |
| **GET** | `/api/live/[roomId]` | Get room details |
| **PUT** | `/api/live/[roomId]` | Update room details |
| **DELETE** | `/api/live/[roomId]` | Close/delete a room |
| **GET** | `/api/live/[roomId]/participants` | Get room participants |
| **POST** | `/api/live/[roomId]/join` | Join a room |
| **DELETE** | `/api/live/[roomId]/join` | Leave a room |
| **POST** | `/api/live/[roomId]/comment` | Send a message |
| **GET** | `/api/live/[roomId]/comment` | Get messages |
| **POST** | `/api/live/[roomId]/reaction` | Send a reaction |
| **GET** | `/api/live/[roomId]/reaction` | Get reaction stats |

---

## File Structure

```
app/
└── api/
    └── live/
        ├── route.ts                          # GET/POST for rooms
        ├── [roomId]/
        │   ├── route.ts                      # GET/PUT/DELETE room
        │   ├── participants/
        │   │   └── route.ts                  # GET participants
        │   ├── join/
        │   │   └── route.ts                  # POST/DELETE join/leave
        │   ├── comment/
        │   │   └── route.ts                  # POST/GET comments
        │   └── reaction/
        │       └── route.ts                  # POST/GET reactions
```

---

## Example Usage

### Create a Room
```bash
curl -X POST http://localhost:3000/api/live \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My Live Stream",
    "hostId": "user_123"
  }'
```

### Join a Room
```bash
curl -X POST http://localhost:3000/api/live/room_123/join \
  -H "Content-Type: application/json" \
  -d '{
    "participantId": "user_456",
    "name": "John",
    "role": "participant"
  }'
```

### Send a Message
```bash
curl -X POST http://localhost:3000/api/live/room_123/comment \
  -H "Content-Type: application/json" \
  -d '{
    "participantId": "user_456",
    "participantName": "John",
    "text": "Great stream!"
  }'
```

### Send a Reaction
```bash
curl -X POST http://localhost:3000/api/live/room_123/reaction \
  -H "Content-Type: application/json" \
  -d '{
    "participantId": "user_456",
    "participantName": "John",
    "emoji": "❤️"
  }'
```

### Get Room Details
```bash
curl http://localhost:3000/api/live/room_123
```

### Get Room Participants
```bash
curl http://localhost:3000/api/live/room_123/participants
```

### Get Messages
```bash
curl http://localhost:3000/api/live/room_123/comment
```

### Get Reaction Stats
```bash
curl http://localhost:3000/api/live/room_123/reaction
```

---

## Integration with Frontend

### Using Fetch API

```typescript
// Create room
const response = await fetch('/api/live', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Stream',
    hostId: userId
  })
});
const { room } = await response.json();

// Join room
const joinResponse = await fetch(`/api/live/${room.id}/join`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participantId: userId,
    name: 'John',
    role: 'participant'
  })
});
const { socketId } = await joinResponse.json();

// Send message
await fetch(`/api/live/${room.id}/comment`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participantId: userId,
    participantName: 'John',
    text: 'Hello everyone!'
  })
});

// Send reaction
await fetch(`/api/live/${room.id}/reaction`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    participantId: userId,
    participantName: 'John',
    emoji: '❤️'
  })
});

// Get room details
const roomResponse = await fetch(`/api/live/${room.id}`);
const { room: details } = await roomResponse.json();

// Get messages
const messagesResponse = await fetch(`/api/live/${room.id}/comment`);
const { messages } = await messagesResponse.json();
```

---

## WebSocket Integration

```typescript
// Connect
const ws = new WebSocket('ws://localhost:3000/ws');

ws.onopen = () => {
  // List rooms
  ws.send(JSON.stringify({ type: 'listRooms' }));
  
  // Join room
  ws.send(JSON.stringify({
    type: 'joinRoom',
    roomId: 'room_123',
    payload: {
      id: 'user_456',
      name: 'John'
    }
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'roomsList') {
    console.log('Available rooms:', message.rooms);
  }
  
  if (message.type === 'comment') {
    console.log('New message:', message.payload);
  }
  
  if (message.type === 'reaction') {
    console.log('New reaction:', message.payload);
  }
};
```

---

## Production Considerations

1. **Database Storage**: Replace in-memory maps with database queries
2. **Authentication**: Add session validation to all endpoints
3. **Authorization**: Verify user permissions (host can delete room, etc.)
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Validation**: Add more robust input validation
6. **Logging**: Add logging for monitoring and debugging
7. **Caching**: Consider caching frequently accessed data
8. **SSL/TLS**: Ensure HTTPS and WSS in production
9. **CORS**: Configure CORS appropriately
10. **Error Handling**: Implement proper error handling and recovery

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 400 | Bad Request - Invalid parameters |
| 404 | Not Found - Room doesn't exist |
| 500 | Server Error - Internal error |

---

## Contact & Support

For questions or issues with the Live API, refer to the full documentation in `LIVE_API_DOCUMENTATION.md`.
