'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Users, UserPlus, UserCheck, Search, RefreshCw, Check, X } from 'lucide-react';
import { useFriendBadges, useFriendRequests, useFriendSuggestions } from '@/hooks/useFriendBadges';
import { FriendEventBadges } from '@/components/FriendBadge';
import { FriendsSkeleton } from '@/components/skeletons/FriendsSkeleton';

interface Person {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  bio: string;
  mutualFriendsCount?: number;
  friendsCount?: number;
}

export default function FriendsPage() {
  const { translation } = useLanguage();
  const [activeTab, setActiveTab] = useState<'requests' | 'suggestions'>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [friendCounts, setFriendCounts] = useState<Record<string, number>>({});
  const [requestsLoaded, setRequestsLoaded] = useState(false);
  const [suggestionsLoaded, setSuggestionsLoaded] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);

  // Utiliser les nouveaux hooks
  const badgesData = useFriendBadges({ refetchInterval: 30000 });
  const requestsData = useFriendRequests({ refetchInterval: 30000 });
  const suggestionsData = useFriendSuggestions({ refetchInterval: 60000 });

  // Handlers pour les actions
  const handleAcceptRequest = async (friendshipId: string, userId: string) => {
    try {
      setActionLoading(friendshipId);
      setActionError(null);

      const response = await fetch('/api/friends', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          friendshipId,
          status: 'accepted',
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'acceptation de la demande');
      }

      // Rafraîchir les données
      await badgesData.refetch();
      await requestsData.refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineRequest = async (friendshipId: string) => {
    try {
      setActionLoading(friendshipId);
      setActionError(null);

      const response = await fetch('/api/friends', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          friendshipId,
          status: 'declined',
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du refus de la demande');
      }

      // Rafraîchir les données
      await badgesData.refetch();
      await requestsData.refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddFriend = async (userId: string) => {
    try {
      setActionLoading(userId);
      setActionError(null);

      const response = await fetch('/api/friends/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de l\'ajout d\'ami');
      }

      // Rafraîchir les données
      await badgesData.refetch();
      await suggestionsData.refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      setActionLoading(friendshipId);
      setActionError(null);

      const response = await fetch(`/api/friends?friendshipId=${friendshipId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression de l\'ami');
      }

      // Rafraîchir les compteurs et listes visibles
      await badgesData.refetch();
      await requestsData.refetch();
      await suggestionsData.refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erreur inconnue');
    } finally {
      setActionLoading(null);
    }
  };

  

  const getCurrentData = () => {
    switch (activeTab) {
      case 'requests':
        return requestsData.requests.map((r: any) => r.fromUser);
      case 'suggestions':
        return suggestionsData.suggestions;
      default:
        return requestsData.requests.map((r: any) => r.fromUser);
    }
  };

  const getLoading = () => {
    switch (activeTab) {
      case 'requests':
        return requestsData.loading;
      case 'suggestions':
        return suggestionsData.loading;
      default:
        return false;
    }
  };

  const getError = () => {
    switch (activeTab) {
      case 'requests':
        return requestsData.error;
      case 'suggestions':
        return suggestionsData.error;
      default:
        return null;
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'requests':
        return <UserPlus className="w-4 h-4" />;
      case 'suggestions':
        return <UserCheck className="w-4 h-4" />;
      default:
        return <Users className="w-4 h-4" />;
    }
  };

  const filteredData = getCurrentData().filter(person =>
    person.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    person.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch real friends count for visible users (cached per-session)
  useEffect(() => {
    const idsToFetch = filteredData
      .map((p: any) => p.id)
      .filter((id: string) => id && friendCounts[id] === undefined);

    if (idsToFetch.length === 0) return;

    let mounted = true;

    (async () => {
      try {
        const results = await Promise.all(
          idsToFetch.map(async (id: string) => {
            try {
              const res = await fetch(`/api/users/${id}/profile`);
              if (!res.ok) return 0;
              const json = await res.json();
              return (json?.user?.friendsCount as number) || 0;
            } catch (e) {
              return 0;
            }
          })
        );

        if (!mounted) return;

        setFriendCounts((prev) => {
          const next = { ...prev };
          idsToFetch.forEach((id, i) => {
            next[id] = results[i];
          });
          return next;
        });
      } catch (e) {
        // ignore individual fetch errors
      }
    })();

    return () => {
      mounted = false;
    };
  }, [filteredData]);

  // Show skeleton while loading initial data
  if (badgesData.loading || requestsData.loading || suggestionsData.loading) {
    return (
      <MainLayout>
        <FriendsSkeleton />
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
        <div className="mb-6 max-w-4xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Demandes et suggestions</h1>

          {/* Error Message */}
          {actionError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{actionError}</p>
            </div>
          )}

          {/* Badges - Event Counters */}
          <div className="mb-6 p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-gray-700 mb-2">Vue d'ensemble</h2>
                <FriendEventBadges
                  pendingRequests={badgesData.badges.pendingRequests}
                  suggestions={badgesData.badges.suggestions}
                  friends={badgesData.badges.friends}
                  loading={badgesData.loading}
                  showPulse={true}
                  layout="horizontal"
                />
              </div>
              <button
                onClick={() => badgesData.refetch()}
                disabled={badgesData.loading}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-blue-200 rounded-lg transition-colors disabled:opacity-50"
                title="Rafraîchir les compteurs"
              >
                <RefreshCw className={`w-5 h-5`} />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg" role="tablist" aria-label="Onglets Amis">
            {[
              { key: 'requests', label: 'Demandes', count: badgesData.badges.pendingRequests },
              { key: 'suggestions', label: 'Suggestions', count: badgesData.badges.suggestions },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key as any);
                  setOffset(0);
                }}
                role="tab"
                aria-pressed={activeTab === tab.key}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all relative focus:outline-none focus:ring-2 focus:ring-primary ${
                  activeTab === tab.key
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {getTabIcon(tab.key)}
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1 -translate-y-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Content */}
          {getError() ? (
            <div className="text-center py-12">
              <p className="text-red-500">{getError()}</p>
            </div>
          ) : (
            <>
              
                <div className="flex flex-col space-y-4">
                  {filteredData.map((person, index) => (
                    <motion.div
                      key={person.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="w-full bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:-translate-y-1 transition-transform transition-shadow"
                    >
                      <a href={`/users/${person.id}`} className="flex items-center space-x-3 mb-3 hover:opacity-80 transition-opacity">
                        <div className="relative">
                          <img
                            src={person.avatar}
                            alt={person.fullName}
                            className="w-12 h-12 rounded-full"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">{person.fullName}</h3>
                          <p className="text-sm text-gray-500 truncate">@{person.username}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {typeof friendCounts[person.id] === 'number'
                              ? `${friendCounts[person.id]} amis`
                              : (person.mutualFriendsCount ?? person.friendsCount ?? 0) + ' amis'}
                          </p>
                        </div>
                      </a>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{person.bio}</p>

                      {activeTab === 'requests' && (
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => {
                              const friendship = requestsData.requests.find((r: any) => r.fromUser.id === person.id);
                              if (friendship) {
                                handleAcceptRequest(friendship.id, person.id);
                              }
                            }}
                            disabled={actionLoading !== null}
                            className="inline-flex items-center justify-center space-x-2 px-3 py-1.5 text-sm text-white bg-primary-dark hover:bg-primary-light rounded-md min-w-[96px] transition-colors disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>{actionLoading === person.id ? 'Acceptation...' : 'Accepter'}</span>
                          </button>
                          <button 
                            onClick={() => {
                              const friendship = requestsData.requests.find((r: any) => r.fromUser.id === person.id);
                              if (friendship) {
                                handleDeclineRequest(friendship.id);
                              }
                            }}
                            disabled={actionLoading !== null}
                            className="inline-flex items-center justify-center space-x-2 px-3 py-1.5 text-sm text-primary-dark border-2 border-primary-dark rounded-md hover:bg-primary-dark hover:text-white transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            <span>{actionLoading === person.id ? 'Refus...' : 'Refuser'}</span>
                          </button>
                        </div>
                      )}

                      {activeTab === 'suggestions' && (
                        <button 
                          onClick={() => handleAddFriend(person.id)}
                          disabled={actionLoading !== null}
                          className="inline-flex items-center justify-center px-3 py-1.5 text-sm bg-primary-dark text-white hover:bg-primary-light rounded-md min-w-[96px] transition-colors disabled:opacity-50"
                          aria-label={`Ajouter ${person.fullName}`}
                        >
                          {actionLoading === person.id ? 'Ajout...' : 'Ajouter'}
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
            </>
          )}

          {filteredData.length === 0 && !getLoading() && !getError() && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'requests' && 'Aucune demande d\'ami'}
                {activeTab === 'suggestions' && 'Aucune suggestion'}
              </h3>
              <p className="text-gray-500 mb-4">
                {activeTab === 'requests' && 'Vous n\'avez pas de demandes d\'ami en attente.'}
                {activeTab === 'suggestions' && 'Aucune suggestion d\'ami pour le moment.'}
              </p>
              {activeTab === 'suggestions' && (
                <div className="flex justify-center">
                  <a href="/explore" className="px-4 py-2 bg-primary-dark text-white rounded-md hover:bg-primary-light">Trouver des utilisateurs</a>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </MainLayout>
  );
}