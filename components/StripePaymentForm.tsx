'use client';

import { useState, FormEvent } from 'react';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripePaymentFormProps {
  amount: number; // Montant en dollars
  description?: string;
  campaignName?: string;
  sponsoredPostId?: string;
  onSuccess?: (paymentIntentId: string) => void;
  onError?: (error: string) => void;
}

/**
 * Formulaire de paiement Stripe intégré (wrapper)
 */
export function StripePaymentForm(props: StripePaymentFormProps) {
  return (
    <Elements
      stripe={stripePromise}
      options={{
        mode: 'payment',
        amount: Math.round(props.amount * 100), // Convertir en cents
        currency: 'usd',
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#2563eb',
            colorBackground: '#ffffff',
            colorText: '#1f2937',
            borderRadius: '0.5rem',
          },
        },
      }}
    >
      <PaymentFormContent {...props} />
    </Elements>
  );
}

/**
 * Contenu du formulaire de paiement
 */
function PaymentFormContent({
  amount,
  description,
  campaignName,
  sponsoredPostId,
  onSuccess,
  onError,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe not loaded');
      return;
    }

    if (!session?.user?.id) {
      setError('Please log in to continue');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Créer un PaymentIntent via notre API
      const createPaymentResponse = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          description: description || `Sponsored Post Campaign - ${campaignName}`,
          sponsoredPostId,
          campaignName,
        }),
      });

      if (!createPaymentResponse.ok) {
        const errorData = await createPaymentResponse.json();
        throw new Error(errorData.error || 'Failed to create payment intent');
      }

      const { clientSecret, paymentIntentId } = await createPaymentResponse.json();

      // 2. Récupérer le CardElement
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // 3. Confirmer le paiement côté client
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: session.user.email || undefined,
            },
          },
        }
      );

      if (confirmError) {
        throw new Error(confirmError.message || 'Payment confirmation failed');
      }

      // 4. Succès!
      if (paymentIntent?.status === 'succeeded') {
        // Rediriger vers la page de confirmation
        onSuccess?.(paymentIntentId);
        router.push(
          `/advertiser/payment-confirmation?payment_intent=${paymentIntentId}&payment_intent_client_secret=${clientSecret}`
        );
      } else {
        // Paiement en attente (3D Secure, etc.)
        router.push(
          `/advertiser/payment-confirmation?payment_intent=${paymentIntentId}&payment_intent_client_secret=${clientSecret}`
        );
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Payment failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Montant à payer */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-gray-600 text-sm mb-1">Montant à payer</p>
        <p className="text-3xl font-bold text-gray-900">${amount.toFixed(2)}</p>
        {campaignName && (
          <p className="text-sm text-gray-500 mt-2">Campagne: {campaignName}</p>
        )}
      </div>

      {/* Détails du paiement */}
      {description && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">{description}</p>
        </div>
      )}

      {/* Élément de carte Stripe */}
      <div className="border border-gray-300 rounded-lg p-4 bg-white">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Informations de la Carte
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#1f2937',
                '::placeholder': {
                  color: '#9ca3af',
                },
              },
              invalid: {
                color: '#ef4444',
              },
            },
          }}
        />
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">
            <span className="font-semibold">Erreur:</span> {error}
          </p>
        </div>
      )}

      {/* Boutons */}
      <div className="space-y-3">
        <button
          type="submit"
          disabled={!stripe || loading}
          className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
          {loading ? 'Traitement...' : `Payer $${amount.toFixed(2)}`}
        </button>

        <p className="text-xs text-gray-500 text-center">
          💳 Paiement sécurisé par Stripe
        </p>
      </div>

      {/* Options de test */}
      {process.env.NODE_ENV === 'development' && (
        <div className="border-t pt-4 mt-4">
          <p className="text-xs text-gray-400 mb-2">Mode test Stripe - Utilisez ces cartes:</p>
          <ul className="text-xs text-gray-400 space-y-1">
            <li>✅ 4242 4242 4242 4242 - Succès</li>
            <li>❌ 4000 0000 0000 0002 - Décliné</li>
            <li>⚠️ 4000 0025 0000 3155 - 3D Secure requis</li>
          </ul>
        </div>
      )}
    </form>
  );
}
