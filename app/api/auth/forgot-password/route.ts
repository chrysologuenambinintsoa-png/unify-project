import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import { sendResetCodeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Always return success (for security - don't reveal if email exists)
    if (!user) {
      return NextResponse.json(
        { 
          message: 'If an account exists with this email, you will receive a password reset link',
          success: true 
        },
        { status: 200 }
      );
    }

    // Generate reset token (keep resetToken for compatibility) and a 6-digit code
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    // Save token and code to database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
        resetCode,
        resetCodeExpiry,
      },
    });

    // Send reset code email (best-effort)
    try {
      await sendResetCodeEmail(email, resetCode);
    } catch (e) {
      console.error('Failed to send reset code email:', e);
    }

    return NextResponse.json(
      { 
        message: 'If an account exists with this email, you will receive a password reset link',
        success: true 
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}
