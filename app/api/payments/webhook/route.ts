import { NextRequest, NextResponse } from 'next/server';
import stripe from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

/**
 * POST /api/payments/webhook
 * Traiter les événements Stripe (paiements complétés, échoués, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      );
    }

    // Vérifier la signature Stripe
    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (error: any) {
      console.error('Webhook signature verification failed:', error.message);
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }

    // Traiter les événements
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        
        // Mettre à jour le statut du paiement
        await prisma.payment.updateMany({
          where: {
            stripePaymentIntentId: paymentIntent.id,
          },
          data: {
            status: 'completed',
            stripeStatus: 'succeeded',
          },
        });

        console.log('✅ Payment succeeded:', paymentIntent.id);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        
        // Mettre à jour le statut du paiement
        await prisma.payment.updateMany({
          where: {
            stripePaymentIntentId: paymentIntent.id,
          },
          data: {
            status: 'failed',
            stripeStatus: 'payment_failed',
            errorMessage: paymentIntent.last_payment_error?.message,
          },
        });

        console.log('❌ Payment failed:', paymentIntent.id);
        break;
      }

      case 'payment_intent.canceled': {
        const paymentIntent = event.data.object;
        
        await prisma.payment.updateMany({
          where: {
            stripePaymentIntentId: paymentIntent.id,
          },
          data: {
            status: 'cancelled',
            stripeStatus: 'canceled',
          },
        });

        console.log('⚠️ Payment cancelled:', paymentIntent.id);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object;
        
        const paymentIntentId = typeof charge.payment_intent === 'string' 
          ? charge.payment_intent 
          : charge.payment_intent?.id;
          
        if (paymentIntentId) {
          await prisma.payment.updateMany({
            where: {
              stripePaymentIntentId: paymentIntentId,
            },
            data: {
              status: 'refunded',
              stripeStatus: 'refunded',
            },
          });

          console.log('🔄 Charge refunded:', charge.id);
        }
        break;
      }

      case 'customer.subscription.updated': {
        // Gérer les mises à jour d'abonnement si nécessaire
        console.log('Subscription updated:', event.data.object.id);
        break;
      }

      case 'customer.subscription.deleted': {
        // Gérer les annulations d'abonnement
        console.log('Subscription deleted:', event.data.object.id);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
