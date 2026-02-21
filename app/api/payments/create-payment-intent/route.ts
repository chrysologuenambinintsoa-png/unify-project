import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import stripe, { formatAmountForStripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/payments/create-payment-intent
 * Créer un PaymentIntent pour payer une campagne sponsorisée
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { amount, description, sponsoredPostId, campaignName } = body;

    // Validation
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount' },
        { status: 400 }
      );
    }

    if (amount < 10) {
      return NextResponse.json(
        { error: 'Minimum amount is $10' },
        { status: 400 }
      );
    }

    if (amount > 100000) {
      return NextResponse.json(
        { error: 'Maximum amount is $100,000' },
        { status: 400 }
      );
    }

    // Créer ou récupérer le client Stripe
    let customer = await stripe.customers.list({
      email: session.user.email || undefined,
      limit: 1,
    });

    let customerId: string;
    if (customer.data.length === 0) {
      const newCustomer = await stripe.customers.create({
        ...(session.user.email && { email: session.user.email }),
        metadata: {
          userId: session.user.id,
        },
      });
      customerId = newCustomer.id;
    } else {
      customerId = customer.data[0].id;
    }

    // Créer le PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: formatAmountForStripe(amount),
      currency: 'usd',
      customer: customerId,
      description: description || 'Sponsored post campaign',
      metadata: {
        userId: session.user.id,
        sponsoredPostId: sponsoredPostId || '',
        campaignName: campaignName || '',
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Sauvegarder la tentative de paiement en base de données
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        stripePaymentIntentId: paymentIntent.id,
        amount,
        currency: 'USD',
        status: 'pending',
        description: description || 'Sponsored post campaign',
        metadata: {
          sponsoredPostId,
          campaignName,
        },
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      paymentId: payment.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
