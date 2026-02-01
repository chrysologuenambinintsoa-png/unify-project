import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { username, email, fullName, dateOfBirth, password, avatar, coverImage } = await request.json();

    // Validate input
    if (!username || !email || !fullName || !dateOfBirth || !password) {
      return NextResponse.json(
        { error: 'Username, email, full name, date of birth, and password are required' },
        { status: 400 }
      );
    }

    // Validate date of birth format (YYYY-MM-DD)
    const dobRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dobRegex.test(dateOfBirth)) {
      return NextResponse.json(
        { error: 'Invalid date of birth format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { username },
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email or username already exists' },
        { status: 400 }
      );
    }

    // Check if IP/session has already created 3 accounts (basic rate limiting)
    const recentAccounts = await prisma.user.findMany({
      where: {
        // Simple check: created in the last 24 hours
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      },
      take: 100, // Limit query
    });

    // Count accounts created from similar patterns (simplified)
    // In a real app, you'd want to track IP address in a separate table
    if (recentAccounts.length >= 3) {
      return NextResponse.json(
        { error: 'Account creation limit reached. Please try again later.' },
        { status: 429 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with date of birth and optional avatar/cover URLs (already uploaded)
    const user = await prisma.user.create({
      data: {
        username,
        email,
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        password: hashedPassword,
        avatar: avatar || null,
        coverImage: coverImage || null,
      },
    });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'User created successfully', user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}