import { NextRequest, NextResponse } from 'next/server';
import { verifySmtpConnection } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    const isConnected = await verifySmtpConnection();
    
    if (isConnected) {
      return NextResponse.json(
        {
          status: 'success',
          message: 'SMTP connection verified successfully',
          config: {
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            user: process.env.SMTP_USER?.substring(0, 5) + '***',
            fromName: process.env.SMTP_FROM_NAME,
            fromEmail: process.env.SMTP_FROM_EMAIL,
          },
        },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        {
          status: 'error',
          message: 'SMTP connection failed. Check your configuration and credentials.',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'An error occurred',
      },
      { status: 500 }
    );
  }
}
