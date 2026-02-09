import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { sendVerificationCodeEmail, sendWelcomeEmail } from '@/lib/email';

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

    try {
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
    } catch (dbError) {
      console.error('[Register] Database query failed:', dbError);
      return NextResponse.json(
        { error: 'Database connection failed. Please try again later.' },
        { status: 503 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    let user;
    try {
      // Create user (unverified)
      user = await prisma.user.create({
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
    } catch (dbError) {
      console.error('[Register] User creation failed:', dbError);
      if (dbError instanceof Error && dbError.message.includes('unique")) {
        return NextResponse.json(
          { error: 'Email or username already exists' },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: 'Failed to create user. Please try again.' },
        { status: 500 }
      );
    }

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    try {
      // Update user with verification code
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationCode,
          verificationCodeExpiry,
        } as any,
      });
    } catch (dbError) {
      console.error('[Register] Failed to update verification code:', dbError);
      // Continue anyway - user has been created
    }

    // Send verification code email (best-effort)
    try {
      await sendVerificationCodeEmail(email, verificationCode);
      console.log(`[Register] Verification code sent to ${email}`);
    } catch (e) {
      console.error('[Register] Failed to send verification email:', e);
      // Don't fail registration if email fails
    }

    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json(
      { message: 'User created successfully. A verification code was sent to the email address.', user: userWithoutPassword },
      { status: 201 }
    );
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('[Register] Unexpected error:', {
      message: errorMsg,
      error: error,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again later.' },
      { status: 500 }
    );
  }
}