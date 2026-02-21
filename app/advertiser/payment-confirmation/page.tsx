'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface PaymentStatus {
  status: 'loading' | 'success' | 'failed' | 'pending';
  message: string;
  paymentId?: string;
  amount?: string;
  campaignName?: string;
}

export default function PaymentConfirmationPage() {
  const searchParams = useSearchParams();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    status: 'loading',
    message: 'Vérification de votre paiement...',
  });

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent');
    const clientSecret = searchParams.get('payment_intent_client_secret');

    if (!paymentIntentId || !clientSecret) {
      setPaymentStatus({
        status: 'failed',
        message: 'Informations de paiement manquantes. Veuillez réessayer.',
      });
      return;
    }

    // Vérifier le statut du paiement via l'API
    const verifyPayment = async () => {
      try {
        const response = await fetch('/api/payments/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId,
            clientSecret,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          setPaymentStatus({
            status: 'success',
            message: 'Paiement réussi! Votre campagne sponsorisée est maintenant active.',
            paymentId: data.paymentId,
            amount: data.amount,
            campaignName: data.campaignName,
          });
        } else {
          setPaymentStatus({
            status: data.status || 'pending',
            message: data.message || 'Statut du paiement en cours de vérification...',
            paymentId: data.paymentId,
          });
        }
      } catch (error) {
        console.error('Error verifying payment:', error);
        setPaymentStatus({
          status: 'failed',
          message: 'Erreur lors de la vérification du paiement. Veuillez contacter le support.',
        });
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Confirmation de Paiement</h1>
        </div>

        {/* Status Message */}
        {paymentStatus.status === 'loading' && (
          <div className="text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
            <p className="mt-4 text-gray-600">{paymentStatus.message}</p>
          </div>
        )}

        {paymentStatus.status === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-green-600 mb-4">Paiement Réussi!</h2>
            <p className="text-gray-700 mb-6">{paymentStatus.message}</p>

            {paymentStatus.amount && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-semibold">Montant payé:</span> {paymentStatus.amount}
                </p>
                {paymentStatus.campaignName && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Campagne:</span> {paymentStatus.campaignName}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3">
              <Link
                href="/advertiser/dashboard"
                className="block w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Voir mon Tableau de Bord
              </Link>
              <Link
                href="/"
                className="block w-full bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Retourner à l'Accueil
              </Link>
            </div>
          </div>
        )}

        {paymentStatus.status === 'pending' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-yellow-600 mb-4">Paiement en Cours</h2>
            <p className="text-gray-700 mb-6">{paymentStatus.message}</p>

            <p className="text-sm text-gray-600 mb-6">
              Votre paiement est en cours de traitement. Veuillez ne pas quitter cette page.
            </p>

            <Link
              href="/advertiser/dashboard"
              className="block w-full bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-300 transition"
            >
              Retourner au Tableau de Bord
            </Link>
          </div>
        )}

        {paymentStatus.status === 'failed' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-red-600 mb-4">Paiement Échoué</h2>
            <p className="text-gray-700 mb-6">{paymentStatus.message}</p>

            <div className="space-y-3">
              <Link
                href="/advertiser/create-campaign"
                className="block w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Réessayer le Paiement
              </Link>
              <Link
                href="/help"
                className="block w-full bg-gray-200 text-gray-800 font-semibold py-3 rounded-lg hover:bg-gray-300 transition"
              >
                Contacter le Support
              </Link>
            </div>
          </div>
        )}

        {/* Footer Debug Info (dev only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-400 text-center">
              Status: {paymentStatus.status}
              {paymentStatus.paymentId && ` | ID: ${paymentStatus.paymentId.slice(0, 8)}...`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
