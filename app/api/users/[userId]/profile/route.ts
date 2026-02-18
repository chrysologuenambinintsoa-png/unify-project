import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// GET /api/users/[userId]/profile - Get user profile by ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Fetch user profile (request only core fields to avoid missing-column DB errors)
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        email: true,
        avatar: true,
        bio: true,
        coverImage: true,
        isVerified: true,
        createdAt: true,
        dateOfBirth: true,
        originCity: true,
        currentCity: true,
        schoolName: true,
        collegeName: true,
        highSchoolName: true,
        universityName: true,
        collegeInfo: true,
        highSchoolInfo: true,
        universityInfo: true,
        skills: true,
        _count: {
          select: {
            posts: true,
            friends1: true,
            friends2: true,
          },
        },
      },
    });

    // If user doesn't exist and it's the current user, create them from available data
    if (!user && session?.user?.id === userId) {
      try {
        console.log('[Profile] Creating missing user from session:', userId);
        
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
        
        const createdUser = await prisma.user.create({
          data: {
            id: userId,
            email: session.user.email || `user_${userId}@local`,
            username: username,
            fullName: session.user.fullName || session.user.name || (session.user.email?.split('@')[0] || 'Utilisateur'),
            avatar: session.user.avatar || session.user.image || null,
          },
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true,
            avatar: true,
            bio: true,
            coverImage: true,
            isVerified: true,
            createdAt: true,
            dateOfBirth: true,
            originCity: true,
            currentCity: true,
            schoolName: true,
            collegeName: true,
            highSchoolName: true,
            universityName: true,
            collegeInfo: true,
            highSchoolInfo: true,
            universityInfo: true,
            skills: true,
            _count: {
              select: {
                posts: true,
                friends1: true,
                friends2: true,
              },
            },
          },
        });
        user = createdUser;
      } catch (createErr) {
        console.error('[Profile] Failed to create missing user:', createErr);
        return NextResponse.json(
          { error: 'Failed to initialize user profile. Please log in again.' },
          { status: 500 }
        );
      }
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate friendship status
    let friendshipStatus = 'none';

    if (session?.user?.id === userId) {
      friendshipStatus = 'self';
    } else if (session?.user?.id) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { user1Id: session.user.id, user2Id: userId },
            { user1Id: userId, user2Id: session.user.id },
          ],
        },
        select: {
          user1Id: true,
          status: true,
        },
      });

      if (friendship) {
        if (friendship.status === 'accepted') {
          friendshipStatus = 'accepted';
        } else if (friendship.status === 'pending') {
          // Check who sent the request
          friendshipStatus = friendship.user1Id === session.user.id ? 'sent' : 'pending';
        }
      }
    }

    const friendsCount = (user._count.friends1 || 0) + (user._count.friends2 || 0);

    // Parse skills if it's a JSON string
    let parsedSkills = [];
    if (user.skills) {
      try {
        parsedSkills = JSON.parse(user.skills);
      } catch (e) {
        parsedSkills = [user.skills];
      }
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        coverImage: user.coverImage,
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        postsCount: user._count.posts || 0,
        friendsCount,
        // About section
        about: {
          dateOfBirth: user.dateOfBirth,
          originCity: user.originCity,
          currentCity: user.currentCity,
          schoolName: user.schoolName,
          collegeName: user.collegeName,
          highSchoolName: user.highSchoolName,
          universityName: user.universityName,
          // prefer structured info if present
          college: user.collegeInfo || (user.collegeName ? { name: user.collegeName } : null),
          highSchool: user.highSchoolInfo || (user.highSchoolName ? { name: user.highSchoolName } : null),
          university: user.universityInfo || (user.universityName ? { name: user.universityName } : null),
          skills: parsedSkills,
        },
      },
      friendshipStatus,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[userId]/profile - Update user profile
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Ensure user exists before updating
    let userExists = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!userExists) {
      try {
        console.log('[Profile PUT] Creating missing user:', userId);
        
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
            id: userId,
            email: session.user.email || `user_${userId}@local`,
            username: username,
            fullName: session.user.fullName || session.user.name || (session.user.email?.split('@')[0] || 'Utilisateur'),
            avatar: session.user.avatar || session.user.image || null,
          },
        });
      } catch (createErr) {
        console.error('[Profile PUT] Failed to create missing user:', createErr);
        return NextResponse.json(
          { error: 'Failed to initialize user profile. Please log in again.' },
          { status: 500 }
        );
      }
    }

    const body = await request.json();

    const updatedUser = await (prisma.user.update({
      where: { id: userId },
      data: {
        fullName: body.fullName,
        bio: body.bio,
        pseudonym: body.pseudonym,
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
        originCity: body.originCity,
        currentCity: body.currentCity,
        schoolName: body.schoolName,
        collegeName: body.collegeName,
        highSchoolName: body.highSchoolName,
        universityName: body.universityName,
        collegeInfo: body.college ? body.college : undefined,
        highSchoolInfo: body.highSchool ? body.highSchool : undefined,
        universityInfo: body.university ? body.university : undefined,
        mobileContact: body.mobileContact,
        familyRelations: body.familyRelations,
        skills: body.skills ? JSON.stringify(body.skills) : undefined,
      } as any,
      select: {
        id: true,
        username: true,
        fullName: true,
        bio: true,
        pseudonym: true,
        mobileContact: true,
        skills: true,
      } as any,
    }) as any);

    // Parse skills
    let parsedSkills = [];
    if (updatedUser.skills) {
      try {
        parsedSkills = JSON.parse(updatedUser.skills);
      } catch (e) {
        parsedSkills = [updatedUser.skills];
      }
    }

    return NextResponse.json({
      user: {
        ...updatedUser,
        skills: parsedSkills,
      },
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

