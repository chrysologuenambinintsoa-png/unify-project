'use client';

import { useState } from 'react';
import { X, Newspaper } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: { name: string; description: string; image?: string }) => Promise<void>;
}

export default function CreatePageModal({ isOpen, onClose, onCreate }: CreatePageModalProps) {
  const [formData, setFormData] = useState({ name: '', description: '', image: '' });
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
      setFormData({ name: '', description: '', image: '' });
      setError('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création de la page');
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
            <div className="bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg p-2">
              <Newspaper className="text-white" size={24} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Créer une page</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition">
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg font-medium text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Nom de la page</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Ma marque"
              disabled={loading}
              className="border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez votre page..."
              disabled={loading}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none"
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

          <div className="flex gap-3 pt-6">
            <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white">
              {loading ? 'Création...' : 'Créer la page'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
