import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ authorized: false }, { status: 401 });
    }

    // Return user info and admin status
    return NextResponse.json({
      authorized: true,
      user: {
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
      },
      // Simple admin check - can be extended
      isAdmin: true, // Any authenticated user can be admin for now
    });
  } catch (error) {
    console.error('Error checking auth:', error);
    return NextResponse.json(
      { error: 'Failed to check authorization' },
      { status: 500 }
    );
  }
}
