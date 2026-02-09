# Live Streaming API Documentation

Complete REST API endpoints for the live streaming feature in Unify.

---

## MediaSoup Integration (server + client)

This project includes a basic MediaSoup adapter skeleton under `lib/mediasoupAdapter.ts` and signaling routes under `/api/live/[roomId]/mediasoup/*`.

Quick setup:

1. Install packages:

```bash
npm install mediasoup mediasoup-client
```

2. Environment variables (optional):

- `MEDIASOUP_WORKERS` - number of workers (default: 1)
- `MEDIASOUP_ANNOUNCED_IP` - public IP announced for media transports

3. Routes added:

- `POST /api/live/[roomId]/mediasoup/create-transport` - create transport
- `POST /api/live/[roomId]/mediasoup/connect-transport` - connect transport (DTLS)
- `POST /api/live/[roomId]/mediasoup/produce` - produce a stream
- `POST /api/live/[roomId]/mediasoup/consume` - create a consumer for a producer

Notes:

- This is a minimal integration. You need to wire the client signaling (in `LiveStreamer`) to call these endpoints and use `mediasoup-client` to create transports, produce and consume.
- The server adapter uses in-memory router/transport lookups. For production persist mapping/state and add auth.

## Base URL
```
/api/live
```

---

## Endpoints

### 1. List All Active Rooms
**GET** `/api/live`

Get all active live streaming rooms.

**Response:**
```json
{
  "ok": true,
  "rooms": [
    {
      "id": "room_1707429301234_567",
      "title": "My Live Stream",
      "hostId": "user_123",
      "participantCount": 5
    }
  ]
}
```

---

### 2. Create a New Room
**POST** `/api/live`

Create a new live streaming room.

**Request Body:**
```json
{
  "title": "My Live Stream",
  "name": "My Live Stream",
  "hostId": "user_123",
  "id": "custom_room_id"
}
```

**Optional parameters:**
- `id`: Custom room ID (auto-generated if not provided)
- `title` / `name`: Room title (required)
- `hostId`: ID of the room host/owner

**Response:**
```json
{
  "ok": true,
  "room": {
    "id": "room_1707429301234_567",
    "title": "My Live Stream"
  }
}
```

**Status Codes:**
- `201 Created`: Room created successfully
- `500 Internal Server Error`: Server error

---

### 3. Get Room Details
**GET** `/api/live/[roomId]`

Get details of a specific live room.

**Parameters:**
- `roomId` (string): The ID of the room

**Response:**
```json
{
  "ok": true,
  "room": {
    "id": "room_1707429301234_567",
    "title": "My Live Stream",
    "hostId": "user_123",
    "participantCount": 5,
    "createdAt": 1707429301234,
    "participants": [
      {
        "id": "user_1",
        "name": "Alice",
        "role": "host"
      },
      {
        "id": "user_2",
        "name": "Bob",
        "role": "participant"
      }
    ]
  }
}
```

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Room not found
- `500 Internal Server Error`: Server error

---

### 4. Update Room Details
**PUT** `/api/live/[roomId]`

Update room information (title, description, etc.).

**Parameters:**
- `roomId` (string): The ID of the room

**Request Body:**
```json
{
  "title": "Updated Stream Title",
  "description": "New description"
}
```

**Response:**
```json
{
  "ok": true,
  "room": {
    "id": "room_1707429301234_567",
    "title": "Updated Stream Title",
    "hostId": "user_123",
    "participantCount": 5
  }
}
```

**Status Codes:**
- `200 OK`: Success
- `400 Bad Request`: Missing room ID
- `404 Not Found`: Room not found
- `500 Internal Server Error`: Server error

---

### 5. Close/Delete a Room
**DELETE** `/api/live/[roomId]`

Close or delete a live room. The room is automatically removed when the last participant leaves.

**Parameters:**
- `roomId` (string): The ID of the room

**Response:**
```json
{
  "ok": true,
  "message": "Room closure initiated. All participants must disconnect."
}
```

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Room not found
- `500 Internal Server Error`: Server error

---

### 6. Get Room Participants
**GET** `/api/live/[roomId]/participants`

Get list of all participants in a room.

**Parameters:**
- `roomId` (string): The ID of the room

**Response:**
```json
{
  "ok": true,
  "roomId": "room_1707429301234_567",
  "count": 5,
  "participants": [
    {
      "id": "user_1",
      "name": "Alice",
      "role": "host"
    },
    {
      "id": "user_2",
      "name": "Bob",
      "role": "participant"
    },
    {
      "id": "user_3",
      "name": "Charlie",
      "role": "viewer"
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Room not found
- `500 Internal Server Error`: Server error

---

### 7. Join a Room
**POST** `/api/live/[roomId]/join`

Join a live streaming room.

**Parameters:**
- `roomId` (string): The ID of the room

**Request Body:**
```json
{
  "participantId": "user_123",
  "name": "John Doe",
  "role": "participant"
}
```

**Parameters:**
- `participantId` (string): Unique ID for the participant
- `name` (string): Display name (default: "Guest")
- `role` (string): Role in the room - "host", "participant", or "viewer" (default: "participant")

**Response:**
```json
{
  "ok": true,
  "message": "John Doe joined the room",
  "roomId": "room_1707429301234_567",
  "socketId": "room_1707429301234_567_user_123_1707429512345",
  "participant": {
    "id": "user_123",
    "name": "John Doe",
    "role": "participant"
  },
  "totalParticipants": 6
}
```

**Status Codes:**
- `200 OK`: Successfully joined
- `400 Bad Request`: Missing required parameters
- `404 Not Found`: Room not found
- `500 Internal Server Error`: Server error

---

### 8. Leave a Room
**DELETE** `/api/live/[roomId]/join`

Leave a live streaming room.

**Parameters:**
- `roomId` (string): The ID of the room

**Request Body:**
```json
{
  "socketId": "room_1707429301234_567_user_123_1707429512345"
}
```

**Parameters:**
- `socketId` (string): The socket ID returned when joining

**Response:**
```json
{
  "ok": true,
  "message": "Successfully left the room",
  "roomId": "room_1707429301234_567",
  "totalParticipants": 5
}
```

**Status Codes:**
- `200 OK`: Successfully left
- `400 Bad Request`: Missing socket ID
- `404 Not Found`: Room not found
- `500 Internal Server Error`: Server error

---

### 9. Send a Comment/Message
**POST** `/api/live/[roomId]/comment`

Send a text message/comment in a live room.

**Parameters:**
- `roomId` (string): The ID of the room

**Request Body:**
```json
{
  "participantId": "user_123",
  "participantName": "John",
  "text": "Great stream!"
}
```

**Parameters:**
- `participantId` (string): ID of the person sending (optional)
- `participantName` (string): Display name (default: "Guest")
- `text` (string): Message text (max 500 characters)

**Response:**
```json
{
  "ok": true,
  "message": "Comment sent successfully",
  "comment": {
    "id": "msg_1707429512345_abc123xyz",
    "roomId": "room_1707429301234_567",
    "participantId": "user_123",
    "participantName": "John",
    "text": "Great stream!",
    "timestamp": 1707429512345
  }
}
```

**Status Codes:**
- `200 OK`: Message sent successfully
- `400 Bad Request`: Missing required fields
- `404 Not Found`: Room not found
- `500 Internal Server Error`: Server error

---

### 10. Get Comments/Messages
**GET** `/api/live/[roomId]/comment`

Get all comments/messages in a room (returns last 50).

**Parameters:**
- `roomId` (string): The ID of the room

**Response:**
```json
{
  "ok": true,
  "roomId": "room_1707429301234_567",
  "count": 15,
  "messages": [
    {
      "id": "msg_1707429512345_abc123xyz",
      "roomId": "room_1707429301234_567",
      "participantId": "user_123",
      "participantName": "John",
      "text": "Great stream!",
      "timestamp": 1707429512345
    }
  ]
}
```

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Room not found
- `500 Internal Server Error`: Server error

---

### 11. Send a Reaction Emoji
**POST** `/api/live/[roomId]/reaction`

Send a reaction emoji in a live room.

**Parameters:**
- `roomId` (string): The ID of the room

**Request Body:**
```json
{
  "participantId": "user_123",
  "participantName": "John",
  "emoji": "❤️"
}
```

**Parameters:**
- `participantId` (string): ID of the person reacting (optional)
- `participantName` (string): Display name (default: "Guest")
- `emoji` (string): Reaction emoji (allowed: 👍 ❤️ 😂 😍 🔥 👏 ⚡ 🎉 😱 💯)

**Response:**
```json
{
  "ok": true,
  "message": "Reaction sent successfully",
  "reaction": {
    "id": "reac_1707429512345_def456uvw",
    "roomId": "room_1707429301234_567",
    "participantId": "user_123",
    "participantName": "John",
    "emoji": "❤️",
    "timestamp": 1707429512345
  },
  "stats": {
    "emoji": "❤️",
    "count": 23
  }
}
```

**Status Codes:**
- `200 OK`: Reaction sent successfully
- `400 Bad Request`: Invalid emoji or missing required fields
- `404 Not Found`: Room not found
- `500 Internal Server Error`: Server error

---

### 12. Get Reaction Statistics
**GET** `/api/live/[roomId]/reaction`

Get reaction statistics for a room.

**Parameters:**
- `roomId` (string): The ID of the room

**Response:**
```json
{
  "ok": true,
  "roomId": "room_1707429301234_567",
  "totalReactions": 150,
  "recentReactions": [
    {
      "id": "reac_1707429512345_def456uvw",
      "roomId": "room_1707429301234_567",
      "participantId": "user_123",
      "participantName": "John",
      "emoji": "❤️",
      "timestamp": 1707429512345
    }
  ],
  "stats": {
    "❤️": 45,
    "👍": 32,
    "🔥": 28,
    "😂": 20,
    "👏": 15,
    "⚡": 10
  }
}
```

**Status Codes:**
- `200 OK`: Success
- `404 Not Found`: Room not found
- `500 Internal Server Error`: Server error

---

## WebSocket Connection

For real-time updates, clients can also connect via WebSocket:

```typescript
// Connect to WebSocket
const ws = new WebSocket('ws://localhost:3000/ws');

// Send messages
ws.send(JSON.stringify({
  type: 'listRooms'
}));

ws.send(JSON.stringify({
  type: 'joinRoom',
  roomId: 'room_123',
  payload: {
    id: 'user_123',
    name: 'John'
  }
}));

// Receive updates
ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};
```

---

## Error Handling

All endpoints follow a consistent error response format:

```json
{
  "ok": false,
  "error": "Error description"
}
```

**Common HTTP Status Codes:**
- `200 OK`: Request successful
- `201 Created`: Resource created
- `400 Bad Request`: Missing or invalid parameters
- `404 Not Found`: Room or resource not found
- `500 Internal Server Error`: Server error

---

## Rate Limiting

- No rate limiting currently implemented
- Recommended: Implement rate limiting for production

---

## Authentication

- Currently no authentication required
- Recommended: Add authentication/authorization in production
- Use NextAuth session validation for protected endpoints

---

## Notes

- Messages are limited to 500 characters
- Last 100 messages per room are stored in memory
- Last 1000 reactions per room are stored in memory
- Rooms are automatically deleted when empty
- For production, use a database instead of in-memory storage
