'use client';

import { useState } from 'react';
import { X, Plus, Search, User } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

interface MemberInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetType: 'group' | 'page';
  onSuccess?: () => void;
}

interface SearchResult {
  id: string;
  username: string;
  fullName: string;
  avatar?: string;
}

export default function MemberInviteModal({
  isOpen,
  onClose,
  targetId,
  targetType,
  onSuccess,
}: MemberInviteModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error('Search failed');
      const data = await res.json();
      setSearchResults(data || []);
    } catch (err) {
      setError('Erreur lors de la recherche');
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    searchUsers(value);
  };

  const toggleUserSelection = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleInvite = async () => {
    if (selectedUsers.size === 0) {
      setError('Veuillez sélectionner au moins un utilisateur');
      return;
    }

    try {
      setInviting('all');
      const endpoint =
        targetType === 'group'
          ? `/api/groups/${targetId}/invite`
          : `/api/pages/${targetId}/invite`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: Array.from(selectedUsers) }),
      });

      if (!res.ok) throw new Error('Invitation failed');

      setSuccessMessage(`${selectedUsers.size} invitation(s) envoyée(s)`);
      setSelectedUsers(new Set());
      setSearchQuery('');
      setSearchResults([]);

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'invitation');
    } finally {
      setInviting(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md max-h-[min(90vh,calc(100vh-2rem))] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Plus size={24} className="text-blue-600" />
            Inviter des membres
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition"
          >
            <X size={24} className="text-gray-600" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg font-medium text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg font-medium text-sm">
            {successMessage}
          </div>
        )}

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <Input
              type="text"
              placeholder="Chercher des utilisateurs..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              disabled={loading}
            />
          </div>

          {/* Search Results */}
          <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Recherche...</div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm">
                {searchQuery
                  ? 'Aucun utilisateur trouvé'
                  : 'Entrez un nom ou pseudo pour chercher'}
              </div>
            ) : (
              <div className="divide-y">
                {searchResults.map((user) => (
                  <div
                    key={user.id}
                    className="p-3 hover:bg-gray-50 cursor-pointer transition flex items-center gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={selectedUsers.has(user.id)}
                      onChange={() => toggleUserSelection(user.id)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <div className="flex-1 flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                          <User size={16} className="text-blue-600" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{user.fullName}</p>
                        <p className="text-xs text-gray-500">@{user.username}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Users Count */}
          {selectedUsers.size > 0 && (
            <div className="p-3 bg-blue-50 rounded-lg text-sm font-medium text-blue-900">
              {selectedUsers.size} utilisateur{selectedUsers.size > 1 ? 's' : ''} sélectionné
              {selectedUsers.size > 1 ? 's' : ''}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={inviting === 'all'}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={handleInvite}
              disabled={selectedUsers.size === 0 || inviting === 'all'}
              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
            >
              {inviting === 'all' ? 'Envoi...' : `Inviter (${selectedUsers.size})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
