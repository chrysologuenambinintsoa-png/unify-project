// Simple in-memory live rooms manager
const rooms = new Map();

function createRoom({ id, title, hostId }) {
  if (!id) throw new Error('id required');
  const room = {
    id,
    title: title || 'Live Room',
    hostId: hostId || null,
    // participants: Map<socket, {id,name,role}>
    participants: new Map(), // socket -> {id, name, role}
    createdAt: Date.now(),
  };
  rooms.set(id, room);
  return room;
}

function getRoom(id) {
  return rooms.get(id);
}

function listRooms() {
  return Array.from(rooms.values()).map((r) => ({ id: r.id, title: r.title, hostId: r.hostId, participantCount: r.participants.size }));
}

function joinRoom(id, socket, participant) {
  const room = rooms.get(id);
  if (!room) return null;
  // normalize participant
  const p = Object.assign({ id: null, name: 'Anonymous', role: 'participant' }, participant || {});
  room.participants.set(socket, p);
  return room;
}

function leaveRoom(id, socket) {
  const room = rooms.get(id);
  if (!room) return;
  room.participants.delete(socket);
  // remove room if empty
  if (room.participants.size === 0) rooms.delete(id);
}

function getParticipants(id) {
  const room = rooms.get(id);
  if (!room) return [];
  return Array.from(room.participants.values()).map((p) => ({ id: p.id, name: p.name, role: p.role }));
}

function findSocketByParticipantId(id) {
  for (const r of rooms.values()) {
    for (const [s, p] of r.participants) {
      if (p && p.id === id) return s;
    }
  }
  return null;
}

module.exports = { createRoom, getRoom, listRooms, joinRoom, leaveRoom, getParticipants, findSocketByParticipantId };
