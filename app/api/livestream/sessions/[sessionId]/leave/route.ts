import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

/**
 * POST /api/livestream/sessions/[sessionId]/leave
 * User leaves a live session
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

    // Find and update viewer
    const viewer = await prisma.liveViewer.findUnique({
      where: {
        sessionId_userId: {
          sessionId,
          userId: session.user.id,
        },
      },
    });

    if (!viewer) {
      return NextResponse.json({ error: "Not a viewer of this session" }, { status: 404 });
    }

    if (viewer.leftAt) {
      return NextResponse.json(viewer, { status: 200 });
    }

    const updated = await prisma.liveViewer.update({
      where: { id: viewer.id },
      data: {
        leftAt: new Date(),
      },
    });

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    console.error("[LiveStream API] LEAVE error:", error);
    return NextResponse.json(
      { error: "Failed to leave session" },
      { status: 500 }
    );
  }
}
