// Live Rooms Manager - TypeScript version
interface Participant {
  id: string;
  name: string;
  role: 'host' | 'participant' | 'viewer';
}

interface LiveRoom {
  id: string;
  title: string;
  description?: string;
  hostId: string | null;
  participants: Map<string, Participant>;
  createdAt: number;
}

class LiveRoomsManager {
  private rooms: Map<string, LiveRoom> = new Map();

  createRoom(config: { id: string; title: string; hostId?: string | null; description?: string }): LiveRoom {
    if (!config.id) throw new Error('id required');
    const room: LiveRoom = {
      id: config.id,
      title: config.title || 'Live Room',
      description: config.description,
      hostId: config.hostId || null,
      participants: new Map(),
      createdAt: Date.now(),
    };
    this.rooms.set(config.id, room);
    return room;
  }

  getRoom(id: string): LiveRoom | undefined {
    return this.rooms.get(id);
  }

  listRooms(): Array<{
    id: string;
    title: string;
    description?: string;
    hostId: string | null;
    participantCount: number;
    createdAt: number;
  }> {
    return Array.from(this.rooms.values()).map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      hostId: r.hostId,
      participantCount: r.participants.size,
      createdAt: r.createdAt,
    }));
  }

  joinRoom(
    id: string,
    socketId: string,
    participant: Omit<Participant, 'id'> & { id?: string }
  ): LiveRoom | null {
    const room = this.rooms.get(id);
    if (!room) return null;

    const p: Participant = {
      id: participant.id || `guest_${Date.now()}`,
      name: participant.name || 'Anonymous',
      role: participant.role || 'participant',
    };

    room.participants.set(socketId, p);
    return room;
  }

  leaveRoom(id: string, socketId: string): void {
    const room = this.rooms.get(id);
    if (!room) return;

    room.participants.delete(socketId);

    // Remove room if empty
    if (room.participants.size === 0) {
      this.rooms.delete(id);
    }
  }

  getParticipants(id: string): Participant[] {
    const room = this.rooms.get(id);
    if (!room) return [];
    return Array.from(room.participants.values());
  }

  findSocketByParticipantId(participantId: string): string | null {
    for (const room of this.rooms.values()) {
      for (const [socketId, participant] of room.participants) {
        if (participant.id === participantId) return socketId;
      }
    }
    return null;
  }

  updateRoom(id: string, updates: { title?: string; description?: string }): LiveRoom | null {
    const room = this.rooms.get(id);
    if (!room) return null;

    if (updates.title) room.title = updates.title;
    if (updates.description !== undefined) room.description = updates.description;

    return room;
  }
}

// Export singleton instance
export const liveRoomsManager = new LiveRoomsManager();
