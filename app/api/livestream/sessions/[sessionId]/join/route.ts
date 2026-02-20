import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/livestream/sessions/[sessionId]/join
 * User joins a live session
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    const { displayName, role = "viewer" } = await request.json();

    // Verify session exists
    const liveSession = await prisma.liveSession.findUnique({
      where: { id: sessionId },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Check if viewer already joined
    let viewer = await prisma.liveViewer.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: session.user.id,
        },
      },
    });

    if (viewer && !viewer.leftAt) {
      // Already joined, return existing record
      return NextResponse.json(viewer, { status: 200 });
    }

    if (viewer && viewer.leftAt) {
      // Re-join after leaving
      const updated = await prisma.liveViewer.update({
        where: { id: viewer.id },
        data: {
          leftAt: null,
          joinedAt: new Date(),
        },
      });
      return NextResponse.json(updated, { status: 200 });
    }

    // Create new viewer record
    const newViewer = await prisma.liveViewer.create({
      data: {
        sessionId,
        userId: session.user.id,
        displayName: displayName || session.user.name || "Guest",
        role,
        joinedAt: new Date(),
      },
    });

    // Update total viewers
    await prisma.liveSession.update({
      where: { id: sessionId },
      data: {
        totalViewers: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(newViewer, { status: 201 });
  } catch (error) {
    console.error("[LiveStream API] JOIN error:", error);
    return NextResponse.json(
      { error: "Failed to join session" },
      { status: 500 }
    );
  }
}
