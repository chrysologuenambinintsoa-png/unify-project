// Configuration Stripe pour côté serveur et client

import Stripe from 'stripe';

// Clé secrète Stripe (côté serveur seulement)
// Utiliser une clé par défaut pour la compilation, elle sera remplacée en production
const stripeKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy_for_build';

const stripe = new Stripe(stripeKey, {
  maxNetworkRetries: 2,
});

export default stripe;

// Clé publique Stripe (côté client)
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

// Validations
export const validateStripeKeys = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  if (!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
    throw new Error('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set');
  }
};

// Types pour les paiements
export interface PaymentIntentData {
  amount: number; // En cents (ex: 50000 = $500)
  currency: string; // 'usd', 'eur', etc.
  description: string;
  metadata: {
    sponsoredPostId?: string;
    advertiserId?: string;
    campaignName?: string;
  };
}

export interface CheckoutSessionData {
  priceId: string;
  customerId?: string;
  clientReferenceId?: string;
  metadata?: Record<string, string>;
  successUrl: string;
  cancelUrl: string;
}

// Utilitaires
export const formatAmountForStripe = (amount: number): number => {
  // Convertir dollars en cents
  return Math.round(amount * 100);
};

export const formatAmountForDisplay = (amount: number): string => {
  // Convertir cents en dollars et formater
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(amount / 100);
};
