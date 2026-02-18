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

    let user = await prisma.user.findUnique({
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
        gender: true,
      },
    });

    // If user doesn't exist, create them from session data
    if (!user) {
      try {
        console.log('[Users Profile GET] Creating missing user:', session.user.id);
        
        // Generate a readable username
        let username = session.user.username;
        if (!username) {
          // Try to extract from email
          if (session.user.email) {
            username = session.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 20);
          } else if (session.user.fullName) {
            username = session.user.fullName.toLowerCase().replace(/[^a-z0-9_\s]/g, '').replace(/\s+/g, '_').substring(0, 20);
          } else {
            username = `user_${Math.random().toString(36).substring(7)}`;
          }
        }
        
        user = await prisma.user.create({
          data: {
            id: session.user.id,
            email: session.user.email || `user_${session.user.id}@local`,
            username: username,
            fullName: session.user.fullName || session.user.name || 'User',
            avatar: session.user.avatar || session.user.image || null,
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
            gender: true,
          },
        });
      } catch (createErr) {
        console.error('[Users Profile GET] Failed to create missing user:', createErr);
        return NextResponse.json(
          { error: 'Failed to initialize user profile. Please log in again.' },
          { status: 500 }
        );
      }
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

    // Ensure user exists before updating
    let userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true },
    });

    if (!userExists) {
      try {
        console.log('[Users Profile PATCH] Creating missing user:', session.user.id);
        
        // Generate a readable username
        let username = session.user.username;
        if (!username) {
          // Try to extract from email
          if (session.user.email) {
            username = session.user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 20);
          } else if (session.user.fullName) {
            username = session.user.fullName.toLowerCase().replace(/[^a-z0-9_\s]/g, '').replace(/\s+/g, '_').substring(0, 20);
          } else {
            username = `user_${Math.random().toString(36).substring(7)}`;
          }
        }
        
        await prisma.user.create({
          data: {
            id: session.user.id,
            email: session.user.email || `user_${session.user.id}@local`,
            username: username,
            fullName: session.user.fullName || session.user.name || 'User',
            avatar: session.user.avatar || session.user.image || null,
          },
        });
      } catch (createErr) {
        console.error('[Users Profile PATCH] Failed to create missing user:', createErr);
        return NextResponse.json(
          { error: 'Failed to initialize user profile. Please log in again.' },
          { status: 500 }
        );
      }
    }

    const body = await request.json();
    const {
      fullName,
      bio,
      coverImage,
      dateOfBirth,
      originCity,
      currentCity,
      college,
      highSchool,
      university,
      skills,
      pseudonym,
      mobileContact,
      familyRelations,
      gender,
    } = body;

    // Build update data with only provided fields
    const updateData: any = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (bio !== undefined) updateData.bio = bio;
    if (coverImage !== undefined) updateData.coverImage = coverImage;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (originCity !== undefined) updateData.originCity = originCity;
    if (currentCity !== undefined) updateData.currentCity = currentCity;
    if (college) updateData.collegeInfo = college;
    if (highSchool) updateData.highSchoolInfo = highSchool;
    if (university) updateData.universityInfo = university;
    if (skills) updateData.skills = JSON.stringify(skills);
    if (pseudonym !== undefined) updateData.pseudonym = pseudonym;
    if (mobileContact !== undefined) updateData.mobileContact = mobileContact;
    if (familyRelations !== undefined) updateData.familyRelations = familyRelations;
    if (gender !== undefined) updateData.gender = gender;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
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
        gender: true,
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
