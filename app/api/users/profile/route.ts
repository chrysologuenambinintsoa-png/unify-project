import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        bio: true,
        avatar: true,
        coverImage: true,
        location: true,
        website: true,
        dateOfBirth: true,
        isVerified: true,
        isPrivate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

// PATCH /api/users/profile - Update user profile
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      fullName,
      bio,
      location,
      website,
      dateOfBirth,
      isPrivate,
      coverImage,
    } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        fullName,
        bio,
        location,
        website,
        dateOfBirth,
        isPrivate,
        coverImage,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        bio: true,
        avatar: true,
        coverImage: true,
        location: true,
        website: true,
        isVerified: true,
        isPrivate: true,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
