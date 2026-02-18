'use client';

import { useState } from 'react';
import { X, Users, Lock, Globe } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string; image?: string; isPrivate: boolean }) => Promise<void>;
}

export default function CreateGroupModal({ isOpen, onClose, onCreate }: CreateGroupModalProps) {
  const [formData, setFormData] = useState({ name: '', description: '', image: '', isPrivate: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Le nom est requis');
      return;
    }
    try {
      setLoading(true);
      await onCreate(formData);
      setFormData({ name: '', description: '', image: '', isPrivate: false });
      setError('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création du groupe');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-2">
              <Users className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Créer un groupe</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg font-medium text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Nom du groupe</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Les amateurs de tech"
              disabled={loading}
              className="border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez votre groupe..."
              disabled={loading}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">URL de l'image (optionnel)</label>
            <Input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/image.jpg"
              disabled={loading}
              className="border-gray-300"
            />
          </div>

          <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <input
              type="checkbox"
              id="isPrivate"
              checked={formData.isPrivate}
              onChange={(e) => setFormData({ ...formData, isPrivate: e.target.checked })}
              disabled={loading}
              className="rounded accent-blue-600 w-4 h-4 cursor-pointer"
            />
            <label htmlFor="isPrivate" className="text-sm font-medium text-gray-900 cursor-pointer flex-1 flex items-center gap-2">
              {formData.isPrivate ? <Lock size={16} className="text-blue-600" /> : <Globe size={16} className="text-gray-600" />}
              {formData.isPrivate ? 'Groupe privé' : 'Groupe public'}
            </label>
          </div>

          <div className="flex gap-3 pt-6">
            <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              {loading ? 'Création...' : 'Créer le groupe'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
