'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { motion } from 'framer-motion';
import { Plus, Flag, Users, Star, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import CreatePageModal from '@/components/CreatePageModal';

interface Page {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  category: string;
  isVerified: boolean;
  followerCount: number;
  createdAt: string;
  owner: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
}

export default function PagesPage() {
  const { translation } = useLanguage();
  const { isReady } = useRequireAuth();
  const router = useRouter();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-pages' | 'discover'>('my-pages');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fonction pour charger les pages
  const fetchPages = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'my-pages' ? '/api/pages?type=my' : '/api/pages?type=discover';
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setPages(data);
      }
    } catch (error) {
      console.error('Error fetching pages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isReady) {
      fetchPages();
    }
  }, [activeTab, isReady]);

  // Ne rien retourner si pas prêt (évite page vide/grise)
  if (!isReady) {
    return null;
  }

  const handleCreatePage = async (data: { name: string; description: string; image?: string }) => {
    const response = await fetch('/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create page');
    fetchPages();
  };



  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Pages</h1>
              <p className="text-gray-600">Découvrez et suivez vos pages préférées</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Créer une page</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('my-pages')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'my-pages'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mes pages
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'discover'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Découvrir
            </button>
          </div>
        </div>

        {/* Pages Grid */}
        <div className={activeTab === 'my-pages' ? 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
          {pages.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Flag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'my-pages' ? 'Aucune page' : 'Aucune page trouvée'}
              </h3>
              <p className="text-gray-500 mb-4">
                {activeTab === 'my-pages'
                  ? 'Vous n\'avez créé ou suivi aucune page pour le moment.'
                  : 'Aucune page ne correspond à vos critères.'}
              </p>
              {activeTab === 'discover' && (
                <Button>Explorer plus de pages</Button>
              )}
            </div>
          ) : activeTab === 'my-pages' ? (
            // Simplified view for "Mes pages" - just avatar and name
            pages.map((page) => (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() => router.push(`/pages/${page.id}`)}
                className="flex flex-col items-center cursor-pointer group"
              >
                <div className="relative mb-2">
                  <img
                    src={page.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=page'}
                    alt={page.name}
                    className="w-16 h-16 rounded-lg object-cover group-hover:opacity-80 transition-opacity"
                  />
                  {page.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full">
                      <Star className="w-3 h-3 fill-current" />
                    </div>
                  )}
                </div>
                <p className="font-medium text-gray-900 text-center text-sm line-clamp-2 group-hover:text-blue-600">
                  {page.name}
                </p>
              </motion.div>
            ))
          ) : (
            pages.map((page) => (
              <motion.div
                key={page.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  {/* Cover Image */}
                  <div className="h-32 bg-gradient-to-r from-green-500 to-blue-600 relative">
                    {page.coverImage && (
                      <img
                        src={page.coverImage}
                        alt={page.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    {page.isVerified && (
                      <div className="absolute top-3 right-3 bg-blue-600 text-white p-1 rounded-full">
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                    )}
                  </div>

                  {/* Page Info */}
                  <div className="p-4">
                    <div className="flex items-start space-x-3 mb-3">
                      <img
                        src={page.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=page'}
                        alt={page.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900">
                            {page.name}
                          </h3>
                          {page.isVerified && (
                            <Star className="w-4 h-4 text-blue-600 fill-current" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {page.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {page.category}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>{page.followerCount.toLocaleString()} abonnés</span>
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        className="flex-1"
                        size="sm"
                        onClick={() => router.push(`/pages/${page.id}`)}
                      >
                        Voir la page
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => fetch(`/api/pages/${page.id}/follow`, { method: 'POST' }).then(() => fetchPages()).catch(() => {})}
                      >
                        Suivre
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      <CreatePageModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreatePage} />
    </MainLayout>
  );
}