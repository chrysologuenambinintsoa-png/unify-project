import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendVerificationCodeEmail, sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Test database connection
    try {
      const testUser = await prisma.user.findFirst({ take: 1 });
      console.log('Database connection OK');
    } catch (dbError) {
      console.error('Database connection failed:', dbError);
      throw new Error(`Database connection failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
    }

    const { username, email, fullName, dateOfBirth, password, avatar, coverImage } = await request.json();

    // Validate input
    if (!username || !email || !fullName || !dateOfBirth || !password) {
      return NextResponse.json(
        { error: 'Username, email, full name, date of birth, and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
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

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
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
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user (unverified)
    const user = await prisma.user.create({
      data: {
        username,
        email,
        fullName,
        dateOfBirth: new Date(dateOfBirth),
        password: hashedPassword,
        avatar: avatar || null,
        coverImage: coverImage || null,
        isVerified: false,
      },
    });

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Update user with verification code (use raw update)
    await prisma.user.update({
      where: { id: user.id },
      data: {
        verificationCode,
        verificationCodeExpiry,
      } as any, // Cast to any to bypass type checking
    });

    // Send verification code email (best-effort)
    try {
      await sendVerificationCodeEmail(email, verificationCode);
      console.log(`Verification code sent to ${email}`);
    } catch (e) {
      console.error('Failed to send verification email:', e);
      // Don't fail registration if email fails
    }

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'User created successfully. A verification code was sent to the email address.', user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('Registration error:', {
      message: errorMsg,
      error: error,
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    // Check for specific database errors
    if (error instanceof Error) {
      if (error.message.includes('unique constraint')) {
        return NextResponse.json(
          { error: 'Email or username already exists' },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to create user. Please try again.', details: errorMsg },
      { status: 500 }
    );
  }
}