'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';

interface SearchResults {
  personnes: any[];
  groupes: any[];
  pages: any[];
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { translation } = useLanguage();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState<SearchResults>({
    personnes: [],
    groupes: [],
    pages: [],
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'personnes' | 'groupes' | 'pages'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [personnesLoaded, setPersonnesLoaded] = useState(false);
  const [groupesLoaded, setGroupesLoaded] = useState(false);
  const [pagesLoaded, setPagesLoaded] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          setResults(data);
          setPersonnesLoaded(true);
          setGroupesLoaded(true);
          setPagesLoaded(true);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  useEffect(() => {
    // Load specific tab data when user switches tabs
    if (!query || loading) return;
    
    if (activeTab === 'personnes' && !personnesLoaded) {
      setTabLoading(true);
      setTimeout(() => {
        setPersonnesLoaded(true);
        setTabLoading(false);
      }, 300);
    } else if (activeTab === 'groupes' && !groupesLoaded) {
      setTabLoading(true);
      setTimeout(() => {
        setGroupesLoaded(true);
        setTabLoading(false);
      }, 300);
    } else if (activeTab === 'pages' && !pagesLoaded) {
      setTabLoading(true);
      setTimeout(() => {
        setPagesLoaded(true);
        setTabLoading(false);
      }, 300);
    }
  }, [activeTab, query, loading, personnesLoaded, groupesLoaded, pagesLoaded]);

  // Add friend handler
  const handleAddFriend = async (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
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
      
      // Refresh results
      const refreshResponse = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setResults(data);
      }
    } catch (error: any) {
      console.error('Error adding friend:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Join group handler
  const handleJoinGroup = async (e: React.MouseEvent, groupId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
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
      
      // Refresh results
      const refreshResponse = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setResults(data);
      }
    } catch (error: any) {
      console.error('Error joining group:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  // Follow page handler
  const handleFollowPage = async (e: React.MouseEvent, pageId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setActionLoading(`page-${pageId}`);
    try {
      const response = await fetch('/api/pages/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to follow page');
      }

      setActionSuccess(`page-${pageId}`);
      setTimeout(() => setActionSuccess(null), 2000);
      
      // Refresh results
      const refreshResponse = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        setResults(data);
      }
    } catch (error: any) {
      console.error('Error following page:', error);
      alert(`Erreur: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const totalResults = results.personnes.length + results.groupes.length + results.pages.length;

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Résultats de recherche
          </h1>
          <p className="text-gray-600">
            {loading ? 'Recherche en cours...' : `${totalResults} résultats trouvés pour "${query}"`}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          {(['all', 'personnes', 'groupes', 'pages'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium border-b-2 ${
                activeTab === tab
                  ? 'text-primary-dark border-primary-dark'
                  : 'text-gray-600 border-transparent hover:text-gray-900'
              }`}
            >
              {tab === 'all' && 'Tous'}
              {tab === 'personnes' && 'Personnes'}
              {tab === 'groupes' && 'Groupes'}
              {tab === 'pages' && 'Pages'}
            </button>
          ))}
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
          </div>
        ) : totalResults === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500 mb-2">Aucun résultat trouvé</p>
            <p className="text-sm text-gray-400">
              Essayez avec d'autres mots-clés
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Personnes */}
            {(activeTab === 'all' || activeTab === 'personnes') && results.personnes.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h2 className="text-lg font-bold text-gray-900 mb-3">Personnes</h2>
                )}
                <div className="space-y-2">
                  {results.personnes.map((person) => (
                    <div key={person.id}>
                      <Link href={`/users/${person.id}/profile`}>
                        <div
                          className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md cursor-pointer"
                        >
                          <div className="flex items-center space-x-3">
                            <Avatar src={person.avatar} name={person.fullName || person.username} userId={person.id} size="sm" className="w-10 h-10" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">
                                  {person.fullName || person.username}
                                </p>
                                {person.isVerified && (
                                  <span className="text-blue-500 text-sm">✓</span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">@{person.username}</p>
                            </div>
                            {person.id !== session?.user?.id && (
                              <button
                                onClick={(e) => handleAddFriend(e, person.id)}
                                disabled={actionLoading === `friend-${person.id}`}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                  actionSuccess === `friend-${person.id}`
                                    ? 'bg-green-100 text-green-700'
                                    : person.friendshipStatus === 'accepted'
                                    ? 'bg-gray-100 text-gray-700 cursor-default'
                                    : person.friendshipStatus === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700 cursor-default'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                              >
                                {actionLoading === `friend-${person.id}` ? (
                                  <span className="inline-block">⏳</span>
                                ) : actionSuccess === `friend-${person.id}` ? (
                                  '✓ Ajouté'
                                ) : person.friendshipStatus === 'accepted' ? (
                                  'Ami'
                                ) : person.friendshipStatus === 'pending' ? (
                                  'En attente'
                                ) : (
                                  translation.buttons?.add || 'Add'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Groupes */}
            {(activeTab === 'all' || activeTab === 'groupes') && results.groupes.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h2 className="text-lg font-bold text-gray-900 mb-3 mt-6">Groupes</h2>
                )}
                <div className="space-y-2">
                  {results.groupes.map((groupe) => (
                    <div key={groupe.id}>
                      <Link href={`/groups/${groupe.id}`}>
                        <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md cursor-pointer">
                          <div className="flex items-center space-x-3">
                            {groupe.image ? (
                              <img
                                src={groupe.image}
                                alt={groupe.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gradient-to-br from-primary-dark to-accent-dark flex items-center justify-center text-white font-bold">
                                {groupe.name?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900">{groupe.name}</p>
                                {groupe.isPrivate && (
                                  <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                                    Privé
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500">
                                {groupe.isMember ? '✓ Membre' : 'Groupe'}
                              </p>
                            </div>
                            {!groupe.isMember && (
                              <button
                                onClick={(e) => handleJoinGroup(e, groupe.id)}
                                disabled={actionLoading === `group-${groupe.id}`}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                  actionSuccess === `group-${groupe.id}`
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                              >
                                {actionLoading === `group-${groupe.id}` ? (
                                  <span className="inline-block">⏳</span>
                                ) : actionSuccess === `group-${groupe.id}` ? (
                                  '✓ Rejoint'
                                ) : (
                                  'Rejoindre'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pages */}
            {(activeTab === 'all' || activeTab === 'pages') && results.pages.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <h2 className="text-lg font-bold text-gray-900 mb-3 mt-6">Pages</h2>
                )}
                <div className="space-y-2">
                  {results.pages.map((page) => (
                    <div key={page.id}>
                      <Link href={`/pages/${page.id}`}>
                        <div className="p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md cursor-pointer">
                          <div className="flex items-center space-x-3">
                            {page.coverImage ? (
                              <img
                                src={page.coverImage}
                                alt={page.name}
                                className="w-10 h-10 rounded object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded bg-gradient-to-br from-primary-dark to-accent-dark"></div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{page.name}</p>
                              <p className="text-sm text-gray-500 line-clamp-1">
                                {page.description}
                              </p>
                            </div>
                            {!page.isFollowing && (
                              <button
                                onClick={(e) => handleFollowPage(e, page.id)}
                                disabled={actionLoading === `page-${page.id}`}
                                className={`px-4 py-2 rounded-lg font-medium ${
                                  actionSuccess === `page-${page.id}`
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-blue-500 text-white hover:bg-blue-600'
                                }`}
                              >
                                {actionLoading === `page-${page.id}` ? (
                                  <span className="inline-block">⏳</span>
                                ) : actionSuccess === `page-${page.id}` ? (
                                  '✓ Suivi'
                                ) : (
                                  'Suivre'
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
