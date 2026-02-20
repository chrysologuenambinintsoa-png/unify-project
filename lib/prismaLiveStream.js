const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Prisma integration for WebSocket live streaming
 * Handles persistence of live sessions, viewers, messages, and reactions
 */

/**
 * Create or get a live session in Prisma
 */
async function createLiveSessionInDB(roomId, hostId, title = "Live Stream") {
  try {
    const session = await prisma.liveSession.create({
      data: {
        id: roomId,
        hostId,
        title,
        status: "live",
        startedAt: new Date(),
      },
    });
    console.log("[Prisma] Created live session:", roomId);
    return session;
  } catch (error) {
    if (error.code === "P2002") {
      // Session already exists
      return await prisma.liveSession.findUnique({ where: { id: roomId } });
    }
    console.error("[Prisma] Failed to create session:", error);
    throw error;
  }
}

/**
 * End a live session
 */
async function endLiveSessionInDB(roomId) {
  try {
    const session = await prisma.liveSession.update({
      where: { id: roomId },
      data: {
        status: "ended",
        endedAt: new Date(),
      },
    });
    console.log("[Prisma] Ended live session:", roomId);
    return session;
  } catch (error) {
    console.error("[Prisma] Failed to end session:", error);
  }
}

/**
 * Add a viewer to the session in Prisma
 */
async function addViewerInDB(roomId, userId, displayName, role = "viewer") {
  try {
    const viewer = await prisma.liveViewer.upsert({
      where: {
        sessionId_userId: {
          sessionId: roomId,
          userId,
        },
      },
      create: {
        sessionId: roomId,
        userId,
        displayName,
        role,
        joinedAt: new Date(),
      },
      update: {
        leftAt: null, // Mark as active again if re-joining
        joinedAt: new Date(),
      },
    });

    // Update total viewers counter
    await prisma.liveSession.update({
      where: { id: roomId },
      data: {
        totalViewers: {
          increment: 1,
        },
      },
    });

    console.log("[Prisma] Added viewer to session:", userId, "->", roomId);
    return viewer;
  } catch (error) {
    console.error("[Prisma] Failed to add viewer:", error);
  }
}

/**
 * Remove a viewer from the session
 */
async function removeViewerFromDB(roomId, userId) {
  try {
    const viewer = await prisma.liveViewer.findUnique({
      where: {
        sessionId_userId: {
          sessionId: roomId,
          userId,
        },
      },
    });

    if (viewer && !viewer.leftAt) {
      await prisma.liveViewer.update({
        where: { id: viewer.id },
        data: {
          leftAt: new Date(),
        },
      });
      console.log("[Prisma] Removed viewer from session:", userId);
    }
  } catch (error) {
    console.error("[Prisma] Failed to remove viewer:", error);
  }
}

/**
 * Store a chat message in Prisma
 */
async function storeMessageInDB(roomId, userId, content) {
  try {
    // Find the viewer record
    const viewer = await prisma.liveViewer.findUnique({
      where: {
        sessionId_userId: {
          sessionId: roomId,
          userId,
        },
      },
    });

    if (!viewer) {
      console.warn(
        "[Prisma] Viewer not found for message from",
        userId,
        "in room",
        roomId
      );
      return null;
    }

    const message = await prisma.liveMessage.create({
      data: {
        sessionId: roomId,
        viewerId: viewer.id,
        content,
        type: "text",
      },
      include: {
        viewer: {
          include: {
            user: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    console.log("[Prisma] Stored message in session:", roomId);
    return message;
  } catch (error) {
    console.error("[Prisma] Failed to store message:", error);
  }
}

/**
 * Store a reaction emoji in Prisma
 */
async function storeReactionInDB(roomId, userId, emoji) {
  try {
    const viewer = await prisma.liveViewer.findUnique({
      where: {
        sessionId_userId: {
          sessionId: roomId,
          userId,
        },
      },
    });

    if (!viewer) {
      console.warn("[Prisma] Viewer not found for reaction from", userId);
      return null;
    }

    const reaction = await prisma.liveReaction.create({
      data: {
        sessionId: roomId,
        viewerId: viewer.id,
        emoji,
      },
    });

    console.log("[Prisma] Stored reaction in session:", roomId);
    return reaction;
  } catch (error) {
    console.error("[Prisma] Failed to store reaction:", error);
  }
}

/**
 * Get active messages from a session
 */
async function getSessionMessagesFromDB(roomId, limit = 50) {
  try {
    const messages = await prisma.liveMessage.findMany({
      where: { sessionId: roomId },
      include: {
        viewer: {
          include: {
            user: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
    });
    return messages;
  } catch (error) {
    console.error("[Prisma] Failed to get session messages:", error);
    return [];
  }
}

/**
 * Get all current viewers in a session
 */
async function getSessionViewersFromDB(roomId) {
  try {
    const viewers = await prisma.liveViewer.findMany({
      where: {
        sessionId: roomId,
        leftAt: null, // Only active viewers
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });
    return viewers;
  } catch (error) {
    console.error("[Prisma] Failed to get session viewers:", error);
    return [];
  }
}

/**
 * Update session viewer count and peak viewers
 */
async function updateSessionStats(roomId, currentViewerCount) {
  try {
    const session = await prisma.liveSession.findUnique({
      where: { id: roomId },
    });

    if (session) {
      const newPeak = Math.max(session.peakViewers, currentViewerCount);
      await prisma.liveSession.update({
        where: { id: roomId },
        data: {
          peakViewers: newPeak,
        },
      });
    }
  } catch (error) {
    console.error("[Prisma] Failed to update session stats:", error);
  }
}

module.exports = {
  prisma,
  createLiveSessionInDB,
  endLiveSessionInDB,
  addViewerInDB,
  removeViewerFromDB,
  storeMessageInDB,
  storeReactionInDB,
  getSessionMessagesFromDB,
  getSessionViewersFromDB,
  updateSessionStats,
};
