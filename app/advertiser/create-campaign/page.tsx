'use client';

import { useState, FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { StripePaymentForm } from '@/components/StripePaymentForm';

interface CampaignFormData {
  campaignName: string;
  description: string;
  budget: string;
  impressions: string;
  content: string;
  link: string;
  image: string;
}

export default function CreateCampaignPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [step, setStep] = useState<'details' | 'payment'>('details');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [campaignId, setCampaignId] = useState<string | null>(null);

  const [formData, setFormData] = useState<CampaignFormData>({
    campaignName: '',
    description: '',
    budget: '100',
    impressions: '10000',
    content: '',
    link: '',
    image: '',
  });

  // Rediriger si non authentifié
  if (status === 'unauthenticated') {
    router.push('/login');
    return null;
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDetailsSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Validation
      if (!formData.campaignName) {
        throw new Error('Le nom de la campagne est requis');
      }
      if (!formData.description) {
        throw new Error('Une description est requise');
      }
      if (!formData.content) {
        throw new Error('Le contenu de la campagne est requis');
      }
      if (!formData.link) {
        throw new Error('L\'URL de destination est requise');
      }

      const budget = parseFloat(formData.budget);
      if (isNaN(budget) || budget < 10 || budget > 100000) {
        throw new Error('Le budget doit être entre $10 et $100,000');
      }

      // Créer la campagne en attente de paiement
      const createResponse = await fetch('/api/sponsored', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.campaignName,
          description: formData.description,
          content: formData.content,
          link: formData.link,
          image: formData.image || 'https://via.placeholder.com/400x300?text=Campaign',
          budget: budget * 100, // Convertir en cents
          impressions: parseInt(formData.impressions) || 10000,
          status: 'pending_payment',
        }),
      });

      if (!createResponse.ok) {
        const errorData = await createResponse.json();
        throw new Error(errorData.error || 'Erreur lors de la création de la campagne');
      }

      const { id } = await createResponse.json();
      setCampaignId(id);
      setStep('payment');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Créer une Campagne Sponsorisée</h1>
          <p className="text-gray-600">Atteignez plus de personnes avec une campagne publicitaire</p>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center gap-4 mb-8">
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              step === 'details'
                ? 'bg-blue-600 text-white'
                : 'bg-green-600 text-white'
            }`}
          >
            1
          </div>
          <div className={`flex-1 h-1 rounded-full ${step === 'payment' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div
            className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
              step === 'payment'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-300 text-gray-600'
            }`}
          >
            2
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          {step === 'details' && (
            <form onSubmit={handleDetailsSubmit} className="p-8 space-y-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Détails de la Campagne</h2>

              {/* Erreur */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    <span className="font-semibold">Erreur:</span> {error}
                  </p>
                </div>
              )}

              {/* Nom de la campagne */}
              <div>
                <label htmlFor="campaignName" className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la Campagne *
                </label>
                <input
                  type="text"
                  id="campaignName"
                  name="campaignName"
                  value={formData.campaignName}
                  onChange={handleInputChange}
                  placeholder="Ex: Vente d'été 2024"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description courte *
                </label>
                <input
                  type="text"
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Description brève de votre campagne"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Contenu */}
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Contenu de la Campagne *
                </label>
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Détails complets de votre campagne"
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Lien */}
              <div>
                <label htmlFor="link" className="block text-sm font-medium text-gray-700 mb-2">
                  URL de Destination *
                </label>
                <input
                  type="url"
                  id="link"
                  name="link"
                  value={formData.link}
                  onChange={handleInputChange}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Image URL */}
              <div>
                <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                  URL de l'Image (optionnel)
                </label>
                <input
                  type="url"
                  id="image"
                  name="image"
                  value={formData.image}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Budget et Impressions (ligne) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                    Budget (USD) *
                  </label>
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    value={formData.budget}
                    onChange={handleInputChange}
                    min="10"
                    max="100000"
                    step="10"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Min: $10, Max: $100,000</p>
                </div>

                <div>
                  <label htmlFor="impressions" className="block text-sm font-medium text-gray-700 mb-2">
                    Impressions Prévues
                  </label>
                  <input
                    type="number"
                    id="impressions"
                    name="impressions"
                    value={formData.impressions}
                    onChange={handleInputChange}
                    min="1000"
                    step="1000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Boutons */}
              <div className="pt-6 border-t flex gap-4">
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                  {submitting ? 'Création...' : 'Continuer vers le Paiement'}
                </button>
              </div>
            </form>
          )}

          {step === 'payment' && (
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Payer pour la Campagne</h2>
              <p className="text-gray-600 mb-6">
                Complétez le paiement pour activer votre campagne sponsorisée
              </p>

              <div className="max-w-md mx-auto">
                <StripePaymentForm
                  amount={parseFloat(formData.budget)}
                  campaignName={formData.campaignName}
                  description={`Campagne sponsorisée: ${formData.campaignName}`}
                  sponsoredPostId={campaignId || undefined}
                  onSuccess={() => {
                    // Redirection gérée par le composant
                  }}
                  onError={(error) => {
                    setError(error);
                  }}
                />
              </div>

              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setStep('details');
                    setError(null);
                  }}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  ← Retour aux détails
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Footer */}
        <div className="mt-8 text-center text-sm text-gray-600">
          <p>💡 Astuce: Vérifiez vos paramètres de campagne avant de payer</p>
        </div>
      </div>
    </div>
  );
}
