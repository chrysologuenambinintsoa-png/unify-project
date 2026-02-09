'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useBadges } from '@/hooks/useBadges';
import { SidebarBadge } from '@/components/SidebarBadge';
import { BadgesOverview } from '@/components/BadgesOverview';

/**
 * Page d'exemple pour tester le système de badges
 * Accessible via /badges-test
 */
export default function BadgesTestPage() {
  const router = useRouter();
  const { badges, loading, error, refetch } = useBadges();

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🎯 Tests des Badges</h1>
          <p className="text-gray-600">Vérifiez le système de badges en temps réel</p>
        </div>

        {/* Errors */}
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6"
          >
            Erreur: {error}
          </div>
        )}

        {/* Loading State */}
        {loading && !badges && (
          <div
            className="inline-block"
          >
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {/* Badges Overview */}
        <div
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-4">📊 Aperçu des Badges</h2>
          <BadgesOverview />
        </div>

        {/* Detailed Stats */}
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {/* Messages Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">💬 Messages</h3>
              <SidebarBadge count={badges.messages} variant="error" size="md" />
            </div>
            <p className="text-gray-600">Messages non lus</p>
            <p className="text-3xl font-bold text-red-500 mt-2">{badges.messages}</p>
          </div>

          {/* Notifications Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">🔔 Notifications</h3>
              <SidebarBadge count={badges.notifications} variant="warning" size="md" />
            </div>
            <p className="text-gray-600">Notifications non lues</p>
            <p className="text-3xl font-bold text-orange-500 mt-2">{badges.notifications}</p>
          </div>

          {/* Friends Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">👥 Amis</h3>
              <SidebarBadge count={badges.friends} variant="default" size="md" />
            </div>
            <p className="text-gray-600">Demandes d'amis en attente</p>
            <p className="text-3xl font-bold text-blue-500 mt-2">{badges.friends}</p>
          </div>

          {/* Groups Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">👫 Groupes</h3>
              <SidebarBadge count={badges.groups} variant="default" size="md" />
            </div>
            <p className="text-gray-600">Invitations de groupe en attente</p>
            <p className="text-3xl font-bold text-purple-500 mt-2">{badges.groups}</p>
          </div>

          {/* Pages Card */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">🚩 Pages</h3>
              <SidebarBadge count={badges.pages} variant="default" size="md" />
            </div>
            <p className="text-gray-600">Invitations de page</p>
            <p className="text-3xl font-bold text-indigo-500 mt-2">{badges.pages}</p>
          </div>

          {/* Total Badge */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">⚡ Total</h3>
              <SidebarBadge 
                count={badges.messages + badges.notifications + badges.friends + badges.groups} 
                variant="error" 
                size="md" 
              />
            </div>
            <p className="text-gray-100">Alertes totales</p>
            <p className="text-4xl font-bold mt-2">
              {badges.messages + badges.notifications + badges.friends + badges.groups}
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div
          className="bg-white rounded-lg shadow-lg p-6 mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">📈 Statistiques</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">👥 Amis</h3>
              <p className="text-4xl font-bold text-blue-500 mb-2">{badges.stats.friends}</p>
              <p className="text-gray-600">Amis total</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">👫 Groupes</h3>
              <p className="text-4xl font-bold text-purple-500 mb-2">{badges.stats.groups}</p>
              <p className="text-gray-600">Groupes rejoints</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div
          className="flex gap-4"
        >
          <button
            onClick={refetch}
            className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-lg"
          >
            🔄 Rafraîchir les données
          </button>
          <button
            onClick={() => router.refresh()}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-lg shadow-lg"
          >
            ↻ Recharger la page
          </button>
        </div>

        {/* Info */}
        <div
          className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8"
        >
          <h3 className="text-lg font-semibold text-blue-900 mb-2">ℹ️ Informations</h3>
          <ul className="text-blue-800 space-y-2">
            <li>✓ Les badges se mettent à jour automatiquement</li>
            <li>✓ Refresh automatique toutes les 30 secondes</li>
            <li>✓ Cliquez sur "Rafraîchir" pour une mise à jour immédiate</li>
            <li>✓ Utilisez le hook useBadges() dans vos composants</li>
            <li>✓ Documentation complète disponible dans API_BADGES_DOCUMENTATION.md</li>
          </ul>
        </div>

        {/* Raw Data */}
        <div
          className="bg-gray-900 text-gray-100 rounded-lg p-6 mt-8 font-mono text-sm overflow-x-auto"
        >
          <h3 className="text-lg font-semibold text-white mb-4">📦 Données brutes</h3>
          <pre>{JSON.stringify(badges, null, 2)}</pre>
        </div>
      </div>
    </div>
  );
}
