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
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        dateOfBirth: true,
        originCity: true,
        currentCity: true,
        collegeInfo: true,
        highSchoolInfo: true,
        universityInfo: true,
        skills: true,
        pseudonym: true,
        mobileContact: true,
        familyRelations: true,
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
    // If database is down, return a minimal user object to allow client to handle gracefully
    if (error instanceof Error && (error.message.includes('P1001') || error.message.includes('Can\'t reach database'))) {
      return NextResponse.json(
        { error: 'Database temporarily unavailable', status: 503 },
        { status: 503 }
      );
    }
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
      coverImage,
    } = body;

    // optional about fields
    const { dateOfBirth, originCity, currentCity, college, highSchool, university, skills, pseudonym, mobileContact, familyRelations } = body;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        fullName,
        bio,
        coverImage,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        originCity,
        currentCity,
        collegeInfo: college ? college : undefined,
        highSchoolInfo: highSchool ? highSchool : undefined,
        universityInfo: university ? university : undefined,
        mobileContact,
        familyRelations,
        skills: skills ? JSON.stringify(skills) : undefined,
      },
      select: {
        id: true,
        email: true,
        username: true,
        fullName: true,
        bio: true,
        avatar: true,
        coverImage: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        dateOfBirth: true,
        originCity: true,
        currentCity: true,
        collegeInfo: true,
        highSchoolInfo: true,
        universityInfo: true,
        skills: true,
        pseudonym: true,
        mobileContact: true,
        familyRelations: true,
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
