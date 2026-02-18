import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar } from '@/components/ui/Avatar';

interface SearchResult {
  personnes: any[];
  groupes: any[];
  pages: any[];
}

interface SearchBarEnhancedProps {
  onClose?: () => void;
}

export const SearchBarEnhanced: React.FC<SearchBarEnhancedProps> = ({ onClose }) => {
  const { data: session } = useSession();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult>({
    personnes: [],
    groupes: [],
    pages: [],
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'personnes' | 'groupes' | 'pages'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Search handler
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults({ personnes: [], groupes: [], pages: [] });
      return;
    }

    const searchTimeout = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(query)}&type=${activeTab === 'all' ? 'all' : activeTab}`
        );
        const data = await response.json();
        setResults(data);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query, activeTab]);

  // Send message
  const handleSendMessage = async (userId: string, username: string) => {
    const messageContent = prompt(`Envoyer un message à @${username}:`);
    if (!messageContent?.trim()) return;

    setActionLoading(`message-${userId}`);
    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: userId,
          content: messageContent,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      setActionSuccess(`message-${userId}`);
      setTimeout(() => setActionSuccess(null), 2000);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Erreur lors de l\'envoi du message');
    } finally {
      setActionLoading(null);
    }
  };

  // Add friend
  const handleAddFriend = async (userId: string) => {
    setActionLoading(`friend-${userId}`);
    try {
      const response = await fetch('/api/friends/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add friend');
      }
      
      setActionSuccess(`friend-${userId}`);
      setTimeout(() => setActionSuccess(null), 2000);
      
      // Refresh search results
      setQuery(query);
    } catch (error: any) {
      console.error('Error adding friend:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Follow page
  const handleFollowPage = async (pageId: string) => {
    setActionLoading(`page-${pageId}`);
    try {
      const response = await fetch('/api/pages/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId }),
      });

      if (!response.ok) throw new Error('Failed to follow page');
      
      setActionSuccess(`page-${pageId}`);
      setTimeout(() => setActionSuccess(null), 2000);
      
      // Refresh search results
      setQuery(query);
    } catch (error) {
      console.error('Error following page:', error);
      alert('Erreur lors du suivi de la page');
    } finally {
      setActionLoading(null);
    }
  };

  // Join group
  const handleJoinGroup = async (groupId: string) => {
    setActionLoading(`group-${groupId}`);
    try {
      const response = await fetch('/api/groups/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join group');
      }
      
      setActionSuccess(`group-${groupId}`);
      setTimeout(() => setActionSuccess(null), 2000);
      
      // Refresh search results
      setQuery(query);
    } catch (error: any) {
      console.error('Error joining group:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher des personnes, groupes, pages..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
        />
      </div>

      {query.length >= 2 && (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b">
            {(['all', 'personnes', 'groupes', 'pages'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'personnes' && 'Personnes'}
                {tab === 'groupes' && 'Groupes'}
                {tab === 'pages' && 'Pages'}
                {tab === 'all' && 'Tous'}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && <div className="text-center text-gray-500 py-4">Recherche en cours...</div>}

          {/* Results */}
          {!loading && query.length >= 2 && (
            <div className="space-y-4">
              {/* Personnes */}
              {(activeTab === 'all' || activeTab === 'personnes') && results.personnes.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-2">Personnes</h3>
                  <div className="space-y-2">
                    {results.personnes.map((person) => (
                      <div key={person.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Avatar src={person.avatar} name={person.fullName || person.username} userId={person.id} size="sm" className="w-10 h-10" />
                          <div>
                            <p className="font-medium">
                              {person.fullName} {person.isVerified && '✓'}
                            </p>
                            <p className="text-sm text-gray-600">@{person.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {person.friendshipStatus !== 'self' && (
                            <>
                              <button
                                onClick={() => handleSendMessage(person.id, person.username)}
                                disabled={actionLoading === `message-${person.id}`}
                                className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                              >
                                {actionLoading === `message-${person.id}` ? '...' : 'Msg'}
                              </button>
                              {person.friendshipStatus === 'none' && (
                                <button
                                  onClick={() => handleAddFriend(person.id)}
                                  disabled={actionLoading === `friend-${person.id}`}
                                  className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                                >
                                  {actionLoading === `friend-${person.id}`
                                    ? '...'
                                    : actionSuccess === `friend-${person.id}`
                                    ? '✓ Envoyé'
                                    : 'Ajouter'}
                                </button>
                              )}
                              {person.friendshipStatus === 'pending' && (
                                <button disabled className="px-3 py-1 bg-gray-400 text-white rounded text-sm">
                                  En attente
                                </button>
                              )}
                              {person.friendshipStatus === 'accepted' && (
                                <button disabled className="px-3 py-1 bg-gray-400 text-white rounded text-sm">
                                  Ami(e)
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Groupes */}
              {(activeTab === 'all' || activeTab === 'groupes') && results.groupes.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-2">Groupes</h3>
                  <div className="space-y-2">
                    {results.groupes.map((group) => (
                      <div key={group.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {group.image && <img src={group.image} alt={group.name} className="w-10 h-10 rounded" />}
                          <div>
                            <p className="font-medium">{group.name}</p>
                            <p className="text-sm text-gray-600">{group.description?.substring(0, 50)}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinGroup(group.id)}
                          disabled={actionLoading === `group-${group.id}`}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            group.isMember
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : actionLoading === `group-${group.id}`
                              ? 'bg-blue-400 text-white'
                              : actionSuccess === `group-${group.id}`
                              ? 'bg-green-500 text-white'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {group.isMember
                            ? 'Membre'
                            : actionLoading === `group-${group.id}`
                            ? '...'
                            : actionSuccess === `group-${group.id}`
                            ? '✓ Rejoint'
                            : 'Rejoindre'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pages */}
              {(activeTab === 'all' || activeTab === 'pages') && results.pages.length > 0 && (
                <div>
                  <h3 className="font-bold text-lg mb-2">Pages</h3>
                  <div className="space-y-2">
                    {results.pages.map((page) => (
                      <div key={page.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {page.image && <img src={page.image} alt={page.name} className="w-10 h-10 rounded" />}
                          <div>
                            <p className="font-medium">
                              {page.name} {page.isVerified && '✓'}
                            </p>
                            <p className="text-sm text-gray-600">{page.category || 'Page'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleFollowPage(page.id)}
                          disabled={actionLoading === `page-${page.id}`}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            page.isFollowing
                              ? 'bg-gray-400 text-white cursor-not-allowed'
                              : actionLoading === `page-${page.id}`
                              ? 'bg-blue-400 text-white'
                              : actionSuccess === `page-${page.id}`
                              ? 'bg-green-500 text-white'
                              : 'bg-blue-500 text-white hover:bg-blue-600'
                          }`}
                        >
                          {page.isFollowing
                            ? 'Suivi'
                            : actionLoading === `page-${page.id}`
                            ? '...'
                            : actionSuccess === `page-${page.id}`
                            ? '✓ Suivi'
                            : 'Suivre'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results */}
              {query.length >= 2 &&
                !loading &&
                results.personnes.length === 0 &&
                results.groupes.length === 0 &&
                results.pages.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    Aucun résultat trouvé pour "{query}"
                  </div>
                )}
            </div>
          )}
        </>
      )}

      {query.length > 0 && query.length < 2 && (
        <div className="text-center text-gray-500 py-4">Tapez au moins 2 caractères pour rechercher</div>
      )}
    </div>
  );
};

export default SearchBarEnhanced;
