'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Plus, Users, Lock, Globe, Settings } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import CreateGroupModal from '@/components/CreateGroupModal';

interface Group {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  coverImage?: string;
  isPrivate: boolean;
  memberCount: number;
  createdAt: string;
  owner: {
    id: string;
    username: string;
    fullName: string;
    avatar: string;
  };
}

export default function GroupsPage() {
  const { translation } = useLanguage();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'my-groups' | 'discover'>('my-groups');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [myGroupsLoaded, setMyGroupsLoaded] = useState(false);
  const [discoverGroupsLoaded, setDiscoverGroupsLoaded] = useState(false);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [activeTab]);

  const fetchGroups = async () => {
    try {
      setTabLoading(true);
      const endpoint = activeTab === 'my-groups' ? '/api/groups?type=my' : '/api/groups?type=discover';
      const response = await fetch(endpoint);
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
        
        if (activeTab === 'my-groups') {
          setMyGroupsLoaded(true);
        } else {
          setDiscoverGroupsLoaded(true);
        }
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
      setTabLoading(false);
    }
  };

  const handleCreateGroup = async (data: { name: string; description: string; image?: string; isPrivate: boolean }) => {
    const response = await fetch('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create group');
    fetchGroups();
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
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{translation.group?.groups || 'Groups'}</h1>
              <p className="text-gray-600">{translation.group?.joinCommunities || 'Join communities that interest you'}</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>{translation.group?.createGroup || 'Create group'}</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('my-groups')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'my-groups'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Mes groupes
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

        {/* Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {activeTab === 'my-groups' ? 'Aucun groupe' : 'Aucun groupe trouvé'}
              </h3>
              <p className="text-gray-500 mb-4">
                {activeTab === 'my-groups'
                  ? 'Vous n\'avez rejoint aucun groupe pour le moment.'
                  : 'Aucun groupe ne correspond à vos critères.'}
              </p>
              {activeTab === 'discover' && (
                <Button>Explorer plus de groupes</Button>
              )}
            </div>
          ) : (
            groups.map((group) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                  {/* Cover Image */}
                  <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600 relative">
                    {group.coverImage && (
                      <img
                        src={group.coverImage}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute top-3 right-3">
                      {group.isPrivate ? (
                        <div className="bg-black bg-opacity-50 text-white p-1 rounded-full">
                          <Lock className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="bg-black bg-opacity-50 text-white p-1 rounded-full">
                          <Globe className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Group Info */}
                  <div className="p-4">
                    <div className="flex items-start space-x-3 mb-3">
                      <img
                        src={group.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=group'}
                        alt={group.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {group.name}
                        </h3>
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {group.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span>{group.memberCount} membres</span>
                      <span>
                        {group.isPrivate ? 'Privé' : 'Public'}
                      </span>
                    </div>

                    <div className="flex space-x-2">
                      <Button className="flex-1" size="sm">
                        {activeTab === 'my-groups' ? 'Voir le groupe' : 'Rejoindre'}
                      </Button>
                      {activeTab === 'my-groups' && (
                        <Button variant="secondary" size="sm">
                          <Settings className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>

      <CreateGroupModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateGroup} />
    </MainLayout>
  );
}