import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

/**
 * GET /api/livestream/sessions
 * List all live sessions (active or recent)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "live";
    const limit = parseInt(searchParams.get("limit") || "20");

    const sessions = await prisma.liveSession.findMany({
      where: status !== "all" ? { status } : undefined,
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
          select: {
            id: true,
            userId: true,
            displayName: true,
            role: true,
            joinedAt: true,
            leftAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // Add current viewer count
    const sessionsWithViewerCount = sessions.map((session) => ({
      ...session,
      currentViewers: session.viewers.filter((v) => !v.leftAt).length,
    }));

    return NextResponse.json(sessionsWithViewerCount, { status: 200 });
  } catch (error) {
    console.error("[LiveStream API] GET sessions error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/livestream/sessions
 * Create a new live session
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, thumbnail } = await request.json();

    const liveSession = await prisma.liveSession.create({
      data: {
        hostId: session.user.id,
        title: title || "Live Stream",
        description,
        thumbnail,
        status: "preparing",
      },
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

    return NextResponse.json(liveSession, { status: 201 });
  } catch (error) {
    console.error("[LiveStream API] POST session error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}
