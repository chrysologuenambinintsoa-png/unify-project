import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/livestream/sessions/[sessionId]/messages
 * Get chat messages from a live session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");

    const messages = await prisma.liveMessage.findMany({
      where: { sessionId },
      include: {
        viewer: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip,
    });

    return NextResponse.json(messages.reverse(), { status: 200 });
  } catch (error) {
    console.error("[LiveStream API] GET messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/livestream/sessions/[sessionId]/messages
 * Send a message to a live session
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
    const { content, type = "text" } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: "Content required" }, { status: 400 });
    }

    // Find viewer
    const viewer = await prisma.liveViewer.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: session.user.id,
        },
      },
    });

    if (!viewer) {
      return NextResponse.json(
        { error: "Must join session to send messages" },
        { status: 403 }
      );
    }

    const message = await prisma.liveMessage.create({
      data: {
        sessionId,
        viewerId: viewer.id,
        content: content.trim(),
        type,
      },
      include: {
        viewer: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    // Broadcast via WebSocket
    // This would be handled by the WebSocket server
    // For now, return the created message

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("[LiveStream API] POST message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
