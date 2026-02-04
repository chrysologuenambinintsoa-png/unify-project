import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { to, subject, message } = await request.json();

    // Validation
    if (!to || !subject || !message) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing required fields: to, subject, message',
        },
        { status: 400 }
      );
    }

    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Invalid email address',
        },
        { status: 400 }
      );
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <p>${message}</p>
      </div>
    `;

    const info = await sendEmail(to, subject, html, message);

    return NextResponse.json(
      {
        status: 'success',
        message: 'Email sent successfully',
        messageId: info.messageId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to send email',
      },
      { status: 500 }
    );
  }
}
