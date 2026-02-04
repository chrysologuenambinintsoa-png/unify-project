import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { email, code, purpose } = await request.json();

    if (!email || !code || !purpose) {
      return NextResponse.json({ error: 'Email, code and purpose are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });
    if (!user) {
      return NextResponse.json({ error: 'Invalid code or email' }, { status: 400 });
    }

    const now = new Date();

    if (purpose === 'signup') {
      const userAny = user as any;
      if (!userAny.verificationCode || !userAny.verificationCodeExpiry) {
        return NextResponse.json({ error: 'No verification code found' }, { status: 400 });
      }
      if (new Date(userAny.verificationCodeExpiry) < now) {
        return NextResponse.json({ error: 'Verification code expired' }, { status: 400 });
      }
      if (userAny.verificationCode !== code) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 400 });
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          verificationCode: null,
          verificationCodeExpiry: null,
        } as any, // Cast to any to bypass type checking
      });

      // Send welcome email (best-effort)
      try {
        await sendWelcomeEmail(email, user.fullName || user.username);
        console.log(`Welcome email sent to ${email}`);
      } catch (e) {
        console.error('Failed to send welcome email:', e);
        // Don't fail verification if email fails
      }

      return NextResponse.json({ message: 'Email verified successfully' }, { status: 200 });
    }

    if (purpose === 'reset') {
      const userAny = user as any;
      if (!userAny.resetCode || !userAny.resetCodeExpiry) {
        return NextResponse.json({ error: 'No reset code found' }, { status: 400 });
      }
      if (new Date(userAny.resetCodeExpiry) < now) {
        return NextResponse.json({ error: 'Reset code expired' }, { status: 400 });
      }
      if (userAny.resetCode !== code) {
        return NextResponse.json({ error: 'Invalid reset code' }, { status: 400 });
      }

      // Return the resetToken so client can call password-reset endpoint if needed
      return NextResponse.json({ message: 'Code validated', resetToken: user.resetToken }, { status: 200 });
    }

    return NextResponse.json({ error: 'Invalid purpose' }, { status: 400 });
  } catch (error) {
    console.error('Verify code error:', error);
    return NextResponse.json({ error: 'Failed to verify code' }, { status: 500 });
  }
}
