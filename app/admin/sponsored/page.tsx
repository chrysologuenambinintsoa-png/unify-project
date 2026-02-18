'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import SponsoredForm from '@/components/SponsoredForm';

interface SponsoredPost {
  id: string;
  title: string;
  description: string;
  content: string;
  image?: string;
  link?: string;
  advertiser: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSponsoredPage() {
  const { isReady, session } = useRequireAuth();
  const [posts, setPosts] = useState<SponsoredPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<SponsoredPost | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Fonction pour charger les posts sponsorisés
  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/sponsored?all=true');
      if (response.ok) {
        const data = await response.json();
        setPosts(data);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch sponsored posts
  useEffect(() => {
    if (session?.user && isReady) {
      fetchPosts();
    }
  }, [session, isReady]);

  // Ne rien retourner si pas prêt (évite page vide/grise)
  if (!isReady) {
    return null;
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce sponsorisé?')) return;

    try {
      setDeleting(id);
      const response = await fetch(`/api/sponsored?id=${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setPosts(posts.filter(p => p.id !== id));
      } else {
        alert('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Erreur lors de la suppression');
    } finally {
      setDeleting(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingPost(null);
  };

  const handleFormSuccess = async (newPost: SponsoredPost) => {
    if (editingPost) {
      setPosts(posts.map(p => p.id === newPost.id ? newPost : p));
    } else {
      setPosts([newPost, ...posts]);
    }
    handleFormClose();
  };

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
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Gestion des Sponsorisés
              </h1>
              <p className="text-gray-600">
                Gérez les annonces sponsorisées de la plateforme
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingPost(null);
                setShowForm(true);
              }}
              className="flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Ajouter un sponsorisé</span>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="p-4">
              <p className="text-gray-600 text-sm">Total</p>
              <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-gray-600 text-sm">Actifs</p>
              <p className="text-2xl font-bold text-green-600">
                {posts.filter(p => p.status === 'active').length}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-gray-600 text-sm">Budget Total</p>
              <p className="text-2xl font-bold text-gray-900">
                ${posts.reduce((sum, p) => sum + p.budget, 0).toFixed(2)}
              </p>
            </div>
          </Card>
          <Card>
            <div className="p-4">
              <p className="text-gray-600 text-sm">Impressions</p>
              <p className="text-2xl font-bold text-gray-900">
                {posts.reduce((sum, p) => sum + p.impressions, 0).toLocaleString()}
              </p>
            </div>
          </Card>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12">Chargement...</div>
        ) : posts.length === 0 ? (
          <Card>
            <div className="p-12 text-center">
              <p className="text-gray-600 mb-4">Aucun sponsorisé trouvé</p>
              <Button
                onClick={() => {
                  setEditingPost(null);
                  setShowForm(true);
                }}
              >
                Ajouter le premier
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                      Titre
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                      Annonceur
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                      Budget
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                      Impressions
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                      Clics
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                      Fin
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post, index) => (
                    <tr
                      key={post.id}
                      className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="px-6 py-3 text-sm">
                        <div>
                          <p className="font-medium text-gray-900 truncate">
                            {post.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            {post.description}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {post.advertiser}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        ${post.budget.toFixed(2)}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {post.impressions.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {post.clicks.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            post.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : post.status === 'paused'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {post.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-900">
                        {new Date(post.endDate).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingPost(post);
                              setShowForm(true);
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id)}
                            disabled={deleting === post.id}
                            className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Form Modal */}
      {showForm && (
        <SponsoredForm
          post={editingPost}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />
      )}
    </MainLayout>
  );
}
