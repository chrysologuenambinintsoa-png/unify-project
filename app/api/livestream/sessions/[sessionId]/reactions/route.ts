import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/livestream/sessions/[sessionId]/reactions
 * Send a reaction (emoji) to a live session
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
    const { emoji } = await request.json();

    if (!emoji) {
      return NextResponse.json({ error: "Emoji required" }, { status: 400 });
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
        { error: "Must join session to send reactions" },
        { status: 403 }
      );
    }

    const reaction = await prisma.liveReaction.create({
      data: {
        sessionId,
        viewerId: viewer.id,
        emoji,
      },
    });

    return NextResponse.json(reaction, { status: 201 });
  } catch (error) {
    console.error("[LiveStream API] POST reaction error:", error);
    return NextResponse.json(
      { error: "Failed to send reaction" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/livestream/sessions/[sessionId]/reactions
 * Get recent reactions from a live session
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100");

    // Get reactions from last minute
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);

    const reactions = await prisma.liveReaction.findMany({
      where: {
        sessionId,
        createdAt: {
          gte: oneMinuteAgo,
        },
      },
      include: {
        viewer: {
          select: {
            displayName: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return NextResponse.json(reactions, { status: 200 });
  } catch (error) {
    console.error("[LiveStream API] GET reactions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}
