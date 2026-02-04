import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendNotificationEmail } from '@/lib/email';

/**
 * POST /api/notifications/send-email
 * Envoie une notification par email à un utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, title, message, type } = body;

    // Validation
    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, message' },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur destinataire
    const recipient = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, username: true },
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Envoyer l'email (best-effort)
    if (recipient.email) {
      try {
        await sendNotificationEmail(recipient.email, title, message);
        console.log(`Notification email sent to ${recipient.email}`);
      } catch (emailError) {
        console.error(`Failed to send notification email to ${recipient.email}:`, emailError);
        // Ne pas bloquer si l'email échoue
      }
    } else {
      console.warn(`Recipient ${recipient.id} has no email address`);
    }

    return NextResponse.json(
      {
        status: 'success',
        message: 'Notification email sent',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Send notification email error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Failed to send notification',
      },
      { status: 500 }
    );
  }
}
