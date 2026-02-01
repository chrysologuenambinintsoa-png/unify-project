import { NextRequest, NextResponse } from 'next/server';

// Stockage en mémoire pour tracker les impressions et clics
const TRACKING_DATA: Record<string, { impressions: number; clicks: number }> = {};

// POST /api/sponsored/[id]/track - Track impressions and clicks
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { type } = await request.json(); // 'impression' or 'click'
    const { id } = await params;

    if (!type || !['impression', 'click'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid track type' },
        { status: 400 }
      );
    }

    // Initialize tracking data if not exists
    if (!TRACKING_DATA[id]) {
      TRACKING_DATA[id] = { impressions: 0, clicks: 0 };
    }

    // Update impressions or clicks
    if (type === 'impression') {
      TRACKING_DATA[id].impressions += 1;
    } else if (type === 'click') {
      TRACKING_DATA[id].clicks += 1;
    }

    return NextResponse.json({
      success: true,
      tracking: TRACKING_DATA[id],
    });
  } catch (error) {
    console.error('Error tracking sponsored post:', error);
    return NextResponse.json(
      { error: 'Failed to track sponsored post' },
      { status: 500 }
    );
  }
}
