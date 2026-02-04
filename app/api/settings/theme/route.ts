import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

// GET /api/settings/theme - Get user's theme preference
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      // Return default theme for unauthenticated users
      return NextResponse.json({ theme: 'auto' });
    }

    // TODO: Fetch from database
    // const user = await prisma.user.findUnique({
    //   where: { email: session.user.email },
    //   select: { theme: true },
    // });
    // return NextResponse.json({ theme: user?.theme || 'auto' });

    return NextResponse.json({ theme: 'auto' });
  } catch (error) {
    console.error('Error fetching theme:', error);
    return NextResponse.json(
      { theme: 'auto' },
      { status: 200 }
    );
  }
}

// POST /api/settings/theme - Update user's theme preference
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    const { theme } = await request.json();

    if (!theme || !['light', 'dark', 'auto'].includes(theme)) {
      return NextResponse.json(
        { error: 'Invalid theme value' },
        { status: 400 }
      );
    }

    if (!session?.user?.email) {
      // For unauthenticated users, just acknowledge and let localStorage handle it
      return NextResponse.json({ success: true, theme });
    }

    // TODO: Save to database
    // const updatedUser = await prisma.user.update({
    //   where: { email: session.user.email },
    //   data: { theme },
    //   select: { theme: true },
    // });

    return NextResponse.json({ 
      success: true, 
      theme 
    });
  } catch (error) {
    console.error('Error saving theme:', error);
    return NextResponse.json(
      { error: 'Failed to save theme' },
      { status: 500 }
    );
  }
}
