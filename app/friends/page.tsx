'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Users, UserPlus, UserCheck, UserX, Search } from 'lucide-react';

interface Person {
  id: string;
  username: string;
  fullName: string;
  avatar: string;
  bio: string;
}

export default function FriendsPage() {
  const { translation } = useLanguage();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'suggestions'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Person[]>([]);
  const [requests, setRequests] = useState<Person[]>([]);
  const [suggestions, setSuggestions] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [friendsRes, requestsRes, suggestionsRes] = await Promise.all([
        fetch('/api/friends?type=accepted'),
        fetch('/api/friends?type=pending'),
        fetch('/api/friends?type=suggestions'),
      ]);

      if (!friendsRes.ok || !requestsRes.ok || !suggestionsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const friendsData = await friendsRes.json();
      const requestsData = await requestsRes.json();
      const suggestionsData = await suggestionsRes.json();

      setFriends(friendsData.friends.map((f: any) => f.friend));
      setRequests(requestsData.friends.map((f: any) => f.friend));
      setSuggestions(suggestionsData.suggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentData = () => {
    switch (activeTab) {
      case 'friends':
        return friends;
      case 'requests':
        return requests;
      case 'suggestions':
        return suggestions;
      default:
        return friends;
    }
  };

  const getTabIcon = (tab: string) => {
    switch (tab) {
      case 'friends':
        return <Users className="w-4 h-4" />;
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

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            {translation.friends.friends}
          </h1>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Rechercher des amis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
            {[
              { key: 'friends', label: 'Amis' },
              { key: 'requests', label: 'Demandes' },
              { key: 'suggestions', label: 'Suggestions' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {getTabIcon(tab.key)}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Content */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-500">Chargement...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredData.map((person, index) => (
                <motion.div
                  key={person.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-3 mb-3">
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
                    </div>
                  </div>

                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{person.bio}</p>

                  {activeTab === 'friends' && (
                    <button className="px-3 py-1 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors">
                      Retirer
                    </button>
                  )}

                  {activeTab === 'requests' && (
                    <div className="flex space-x-2">
                      <button className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors">
                        Accepter
                      </button>
                      <button className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                        Refuser
                      </button>
                    </div>
                  )}

                  {activeTab === 'suggestions' && (
                    <button className="px-3 py-1 text-sm bg-primary text-white rounded-lg hover:bg-primary-light transition-colors">
                      Ajouter
                    </button>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {filteredData.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'friends' && 'Aucun ami trouvé'}
                {activeTab === 'requests' && 'Aucune demande d\'ami'}
                {activeTab === 'suggestions' && 'Aucune suggestion'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'friends' && 'Vous n\'avez pas encore d\'amis.'}
                {activeTab === 'requests' && 'Vous n\'avez pas de demandes d\'ami en attente.'}
                {activeTab === 'suggestions' && 'Aucune suggestion d\'ami pour le moment.'}
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </MainLayout>
  );
}