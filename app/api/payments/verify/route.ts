import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import stripe from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

/**
 * POST /api/payments/verify
 * Vérifier le statut d'un paiement Stripe
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { paymentIntentId, clientSecret } = await request.json();

    if (!paymentIntentId || !clientSecret) {
      return NextResponse.json(
        { error: 'Missing paymentIntentId or clientSecret' },
        { status: 400 }
      );
    }

    // Récupérer le PaymentIntent depuis Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Vérifier que le clientSecret correspond
    if (paymentIntent.client_secret !== clientSecret) {
      return NextResponse.json(
        { error: 'Invalid client secret' },
        { status: 400 }
      );
    }

    // Récupérer le paiement depuis la base de données
    const payment = await prisma.payment.findUnique({
      where: {
        stripePaymentIntentId: paymentIntentId,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Vérifier que le paiement appartient à l'utilisateur actuel
    if (payment.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Déterminer le statut
    let status = 'pending';
    let message = 'Paiement en cours de traitement...';

    switch (paymentIntent.status) {
      case 'succeeded':
        status = 'success';
        message = 'Paiement réussi!';
        break;
      case 'processing':
        status = 'pending';
        message = 'Paiement en cours de traitement...';
        break;
      case 'requires_payment_method':
      case 'requires_action':
        status = 'pending';
        message = 'Action requise pour compléter le paiement...';
        break;
      case 'requires_confirmation':
        status = 'pending';
        message = 'Veuillez confirmer votre paiement...';
        break;
      case 'canceled':
        status = 'failed';
        message = 'Paiement annulé.';
        break;
    }

    return NextResponse.json({
      status,
      message,
      paymentId: payment.id,
      amount: `$${(payment.amount / 100).toFixed(2)}`,
      campaignName: (payment.metadata as any)?.campaignName || 'Unnamed Campaign',
      stripeStatus: paymentIntent.status,
    });
  } catch (error: any) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Payment verification failed', message: error.message },
      { status: 500 }
    );
  }
}
