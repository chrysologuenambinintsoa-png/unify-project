'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
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
      setError('Name is required');
      return;
    }
    try {
      setLoading(true);
      await onCreate(formData);
      setFormData({ name: '', description: '', image: '' });
      setError('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create page');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl shadow-2xl p-8 w-full max-w-md border-2 border-amber-200">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-amber-500 to-yellow-600 rounded-lg p-2">
              <span className="text-white text-2xl">📄</span>
            </div>
            <h2 className="text-2xl font-bold text-amber-900">Créer une page</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-amber-200 rounded-full transition">
            <X size={24} className="text-amber-900" />
          </button>
        </div>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-amber-900 mb-2">Nom de la page</label>
            <Input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Entrez le nom de la page"
              disabled={loading}
              className="border-amber-300 focus:border-amber-500 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-amber-900 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Décrivez votre page"
              disabled={loading}
              className="w-full p-3 border-2 border-amber-300 rounded-lg text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-amber-900 mb-2">URL de l'image (optionnel)</label>
            <Input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://example.com/image.jpg"
              disabled={loading}
              className="border-amber-300 focus:border-amber-500 focus:ring-amber-500"
            />
          </div>

          <div className="flex gap-3 pt-6">
            <Button variant="outline" onClick={onClose} disabled={loading} className="flex-1 border-2 border-amber-300 text-amber-900 hover:bg-amber-100">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white font-bold">
              {loading ? 'Création...' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
