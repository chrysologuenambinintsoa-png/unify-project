"use client";

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { Users, MessageSquare, Settings, Plus, Lock, Globe, Edit2, Camera, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { motion } from 'framer-motion';
import { GroupManagementPanel } from '@/components/GroupManagementPanel';
import { GroupMembers } from '@/components/GroupMembers';
import { GroupPostCreator } from '@/components/GroupPostCreator';
import { CoverImageUploadModal } from '@/components/CoverImageUploadModal';
import Post from '@/components/Post';
import { GroupSkeleton } from '@/components/skeletons/GroupSkeleton';

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
  members?: any[];
  posts?: any[];
  _count?: {
    members: number;
    posts: number;
  };
}

interface GroupClientProps {
  groupId: string;
}

export function GroupDetailClient({ groupId }: GroupClientProps) {
  const { translation } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'posts' | 'members' | 'settings'>('overview');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  useEffect(() => {
    const tabParam = searchParams?.get?.('tab');
    if (tabParam) setActiveTab(tabParam as any);
  }, [searchParams]);

  useEffect(() => {
    if (groupId) fetchGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, session?.user?.id]);

  const fetchGroup = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) throw new Error('Failed to fetch group');
      const data = await res.json();
      setGroup(data);
      setIsAdmin(data.owner?.id === session?.user?.id);
      setIsMember(data.isMember || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  // Lightweight refresh for posts only
  const refreshGroupPosts = async () => {
    if (!group) return;
    try {
      const res = await fetch(`/api/groups/${groupId}`);
      if (!res.ok) throw new Error('Failed to fetch group');
      const data = await res.json();
      // Only update posts, keep rest of group state
      setGroup(prev => prev ? { ...prev, posts: data.posts, _count: { posts: data._count?.posts || 0, members: prev._count?.members || 0 } } : null);
    } catch (err) {
      console.error('Error refreshing posts:', err);
    }
  };

  const handleCoverUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'cover');

      const res = await fetch(`/api/groups/${groupId}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload cover');
      const data = await res.json();
      setGroup(prev => prev ? { ...prev, coverImage: data.coverImage } : null);
      setShowCoverUpload(false);
    } catch (err) {
      console.error('Error uploading cover:', err);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');

      const res = await fetch(`/api/groups/${groupId}/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Failed to upload avatar');
      const data = await res.json();
      setGroup(prev => prev ? { ...prev, avatar: data.avatar } : null);
      setShowAvatarUpload(false);
    } catch (err) {
      console.error('Error uploading avatar:', err);
    }
  };

  const handleJoinGroup = async () => {
    if (!session?.user?.id) return;

    try {
      setIsJoining(true);
      const res = await fetch(`/api/groups/${groupId}/join`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to join group');
      setIsMember(true);
      fetchGroup();
    } catch (err) {
      console.error('Error joining group:', err);
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <GroupSkeleton />
      </MainLayout>
    );
  }
  if (error) return (
    <MainLayout>
      <div className="p-6 text-center text-red-600">{error}</div>
    </MainLayout>
  );
  if (!group) return (
    <MainLayout>
      <div className="p-6 text-center">{translation.group?.groupNotFound || 'Group not found'}</div>
    </MainLayout>
  );

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-6xl mx-auto"
      >
        {/* Cover Image Section */}
        <div className="relative mb-6">
          <div className="relative h-64 w-full rounded-xl overflow-hidden bg-gradient-to-r from-primary to-accent dark:from-primary-dark dark:to-accent">
            {group.coverImage ? (
              <Image src={group.coverImage} alt={group.name} fill className="object-cover" />
            ) : null}
            {isAdmin && (
              <button
                onClick={() => setShowCoverUpload(true)}
                className="absolute bottom-4 right-4 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition shadow-lg"
              >
                <Camera size={20} />
              </button>
            )}
          </div>

          {/* Group Header with Avatar */}
          <div className="relative px-6 pb-6">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="relative -mt-16">
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-lg bg-gray-200">
                  {group.avatar ? (
                    <Image src={group.avatar} alt={group.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent dark:from-primary-dark dark:to-accent">
                      <span className="text-white text-4xl font-bold">{group.name.charAt(0)}</span>
                    </div>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => setShowAvatarUpload(true)}
                      className="absolute bottom-2 right-2 bg-white text-gray-900 p-1 rounded-full hover:bg-gray-100 transition shadow-lg"
                    >
                      <Camera size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Group Info */}
              <div className="flex-1 flex items-end justify-between pb-2">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{group.name}</h1>
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      {group.isPrivate ? <Lock size={16} /> : <Globe size={16} />}
                      {group.isPrivate ? (translation.group?.private || 'Private') : (translation.group?.public || 'Public')}
                    </span>
                    <span>{group._count?.members || 0} {translation.group?.members || 'members'}</span>
                  </div>
                </div>
                {isAdmin && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setActiveTab('settings')}
                    className="flex items-center gap-2"
                  >
                    <Settings size={16} />
                    {translation.group?.manage || 'Manage'}
                  </Button>
                )}
                {!isAdmin && !isMember && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleJoinGroup}
                    disabled={isJoining}
                    className="flex items-center gap-2 font-semibold"
                  >
                    {isJoining ? (translation.group?.joining || 'Joining...') : (translation.group?.joinThisGroup || 'Join this group')}
                  </Button>
                )}
                {!isAdmin && isMember && (
                  <div className="flex items-center gap-2 text-primary dark:text-accent font-semibold">
                    {translation.group?.isMember || '✓ Member'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {group.description && (
          <Card className="mb-6 p-6">
            <p className="text-gray-700">{group.description}</p>
          </Card>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200">
            {(['overview', 'posts', 'members', 'settings'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium text-sm transition ${
                  activeTab === tab
                    ? 'border-b-2 border-primary dark:border-accent text-primary dark:text-accent'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab === 'overview' && (translation.group?.overview || 'Overview')}
                {tab === 'posts' && (translation.group?.posts || 'Posts')}
                {tab === 'members' && (translation.group?.members || 'Members')}
                {tab === 'settings' && (translation.group?.settings || 'Settings')}  
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary dark:text-accent">{group._count?.members || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{translation.group?.members || 'Members'}</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary/80 dark:text-accent/80">{group._count?.posts || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{translation.group?.posts || 'Posts'}</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary/60 dark:text-accent/60">{new Date(group.createdAt).toLocaleDateString('fr-FR')}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{translation.group?.created || 'Created'}</p>
                  </Card>
                </div>
              </div>
              <div>
                <Card className="p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{translation.group?.information || 'Information'}</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{translation.group?.creator || 'Creator'}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{group.owner?.fullName || group.owner?.username || translation.common?.unknown || 'Unknown'}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{translation.group?.privacy || 'Privacy'}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{group.isPrivate ? (translation.group?.private || 'Private') : (translation.group?.public || 'Public')}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Posts Tab */}
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {/* Post Creator - Only show if user is member/admin */}
              {(isAdmin || isMember) && (
                <GroupPostCreator groupId={groupId} onPostCreated={refreshGroupPosts} />
              )}
              
              {group.posts && group.posts.length > 0 ? (
                group.posts.map((post: any) => (
                  <Post key={post.id} post={post} />
                ))
              ) : (
                <Card className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">{translation.group?.noPosts || 'No posts yet'}</p>
                </Card>
              )}
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <GroupMembers groupId={groupId} isAdmin={isAdmin} />
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && isAdmin && (
            <GroupManagementPanel
              groupId={groupId}
              groupData={{
                name: group.name,
                description: group.description,
                visibility: group.isPrivate ? 'private' : 'public',
                profileImage: group.avatar,
                isPrivate: group.isPrivate,
              }}
              isAdmin={isAdmin}
              onGroupUpdated={fetchGroup}
            />
          )}
        </div>

        {/* Cover Upload Modal */}
        <CoverImageUploadModal
          isOpen={showCoverUpload}
          onClose={() => setShowCoverUpload(false)}
          onUpload={handleCoverUpload}
          currentImage={group.coverImage}
          title={translation.group?.changeCover || 'Change group cover'}
        />

        {/* Avatar Upload Modal */}
        <CoverImageUploadModal
          isOpen={showAvatarUpload}
          onClose={() => setShowAvatarUpload(false)}
          onUpload={handleAvatarUpload}
          currentImage={group.avatar}
          title={translation.group?.changeAvatar || 'Change group avatar'}
        />
      </motion.div>
    </MainLayout>
  );
}
