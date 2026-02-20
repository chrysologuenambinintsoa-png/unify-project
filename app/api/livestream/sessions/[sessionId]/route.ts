import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    const session = await prisma.liveSession.findUnique({
      where: { id: sessionId },
      include: {
        host: {
          select: {
            id: true,
            username: true,
            avatar: true,
            fullName: true,
          },
        },
        viewers: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatar: true,
              },
            },
          },
          where: {
            leftAt: null, // Only active viewers
          },
        },
        messages: {
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
          take: 100, // Last 100 messages
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(session, { status: 200 });
  } catch (error) {
    console.error("[LiveStream API] GET session error:", error);
    return NextResponse.json(
      { error: "Failed to fetch session" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/livestream/sessions/[sessionId]
 * Update session status or metadata
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId } = await params;
    const { status, title, description } = await request.json();

    // Verify ownership
    const liveSession = await prisma.liveSession.findUnique({
      where: { id: sessionId },
    });

    if (!liveSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (liveSession.hostId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If ending the session, update stats
    const updateData: any = {
      ...(status && { status }),
      ...(title && { title }),
      ...(description && { description }),
    };

    if (status === "live" && !liveSession.startedAt) {
      updateData.startedAt = new Date();
    }

    if (status === "ended" && !liveSession.endedAt) {
      updateData.endedAt = new Date();
    }

    const updated = await prisma.liveSession.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        host: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("[LiveStream API] PATCH session error:", error);
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }
}
