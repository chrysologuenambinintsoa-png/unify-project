'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { Settings, Megaphone, BarChart3, Users } from 'lucide-react';

export default function AdminPage() {
  const { isReady, session } = useRequireAuth();
  const router = useRouter();

  // Ne rien retourner si pas prêt (évite page vide/grise)
  if (!isReady) {
    return null;
  }

  const adminSections = [
    {
      title: 'Gestion des Sponsorisés',
      description: 'Gérez les annonces sponsorisées affichées sur la plateforme',
      icon: Megaphone,
      href: '/admin/sponsored',
      color: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Statistiques',
      description: 'Consultez les statistiques des sponsorisés et de la plateforme',
      icon: BarChart3,
      href: '/admin/stats',
      color: 'from-green-500 to-green-600',
      coming_soon: true,
    },
    {
      title: 'Utilisateurs',
      description: 'Gérez les utilisateurs et leurs permissions',
      icon: Users,
      href: '/admin/users',
      color: 'from-purple-500 to-purple-600',
      coming_soon: true,
    },
    {
      title: 'Paramètres',
      description: 'Configurez les paramètres généraux de la plateforme',
      icon: Settings,
      href: '/admin/settings',
      color: 'from-orange-500 to-orange-600',
      coming_soon: true,
    },
  ];

  if (status === 'loading') {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="text-lg text-gray-600">Chargement...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Panneau d'Administration
          </h1>
          <p className="text-gray-600">
            Bienvenue, {session?.user?.name || 'utilisateur'}. Gérez les différents secteurs de la plateforme.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {adminSections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.href}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <button
                  onClick={() => {
                    if (!section.coming_soon) {
                      router.push(section.href);
                    }
                  }}
                  className={`w-full text-left ${
                    section.coming_soon ? 'opacity-75 cursor-not-allowed' : 'cursor-pointer'
                  }`}
                  disabled={section.coming_soon}
                >
                  <Card className="hover:shadow-lg transition-all h-full">
                    <div
                      className={`h-24 bg-gradient-to-r ${section.color} flex items-center justify-center relative overflow-hidden`}
                    >
                      <Icon className="w-12 h-12 text-white opacity-80" />
                      {section.coming_soon && (
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            Bientôt disponible
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {section.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {section.description}
                      </p>
                    </div>
                  </Card>
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Aperçu rapide
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-2">Plateforme</p>
                <p className="text-3xl font-bold text-gray-900">Unify</p>
                <p className="text-xs text-gray-500 mt-2">Application sociale moderne</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-2">Version</p>
                <p className="text-3xl font-bold text-gray-900">1.0</p>
                <p className="text-xs text-gray-500 mt-2">Dernière version stable</p>
              </div>
            </Card>
            <Card>
              <div className="p-6">
                <p className="text-gray-600 text-sm mb-2">Statut</p>
                <p className="text-3xl font-bold text-green-600">En ligne</p>
                <p className="text-xs text-gray-500 mt-2">Production active</p>
              </div>
            </Card>
          </div>
        </div>
      </motion.div>
    </MainLayout>
  );
}
