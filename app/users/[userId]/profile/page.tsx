'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PhotoGallery } from '@/components/profile/PhotoGallery';
import { About } from '@/components/profile/About';
import Post from '@/components/Post';
import { optimizeAvatarUrl, optimizeCoverUrl } from '@/lib/cloudinaryOptimizer';
import { Mail, Calendar, Image, FileText, Users } from 'lucide-react';

interface Photo {
  id: string;
  url: string;
  type: 'profile' | 'cover' | 'gallery';
  caption?: string;
  createdAt: string;
}

interface AboutInfo {
  dateOfBirth?: string;
  originCity?: string;
  currentCity?: string;
  schoolName?: string;
  collegeName?: string;
  highSchoolName?: string;
  universityName?: string;
  skills?: string[];
  pseudonym?: string;
}

interface UserProfile {
  id: string;
  username: string;
  fullName: string;
  email: string;
  avatar: string | null;
  bio: string | null;
  coverImage?: string | null;
  createdAt: string;
  isVerified: boolean;
  postsCount: number;
  friendsCount: number;
  about?: AboutInfo;
  photoGallery?: Photo[];
}

interface FriendshipStatus {
  status: 'self' | 'accepted' | 'pending' | 'sent' | 'none';
}

interface PostData {
  id: string;
  content: string;
  images?: string[];
  media?: Array<{ url: string }>;
  createdAt: string;
  author?: any;
  user?: any;
  likes?: number | any[];
  comments?: number | any[];
  shares?: number;
  liked?: boolean;
  _count?: { likes: number; comments: number };
}

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const { translation } = useLanguage();
  const userId = params?.userId as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [friendshipStatus, setFriendshipStatus] = useState<string>('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'about' | 'gallery' | 'posts' | 'friends' | null>(null);

  useEffect(() => {
    // Guard: only fetch if userId is defined and not undefined
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/users/${userId}/profile`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError('Utilisateur non trouvé');
          } else {
            setError('Erreur lors du chargement du profil');
          }
          setProfile(null);
          return;
        }

        const data = await response.json();
        setProfile(data.user);
        setFriendshipStatus(data.friendshipStatus || 'none');
        setPhotos(data.user.photoGallery || []);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Fetch user posts
  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        setPostsLoading(true);
        const response = await fetch(`/api/users/${userId}/posts`);
        
        if (!response.ok) {
          console.error('Error fetching posts');
          setPosts([]);
          return;
        }

        const data = await response.json();
        setPosts(Array.isArray(data) ? data : data.posts || []);
      } catch (err) {
        console.error('Error fetching user posts:', err);
        setPosts([]);
      } finally {
        setPostsLoading(false);
      }
    };

    if (userId) {
      fetchUserPosts();
    }
  }, [userId]);

  // Refresh photos when gallery section is opened
  const handleSectionChange = async (section: 'about' | 'gallery' | 'posts' | 'friends' | null) => {
    setSelectedSection(section);
    
    // Refresh gallery photos if gallery section is selected
    if (section === 'gallery') {
      try {
        const response = await fetch(`/api/users/${userId}/photos`);
        if (response.ok) {
          const data = await response.json();
          setPhotos(data.photos || []);
        }
      } catch (err) {
        console.error('Error refreshing photos:', err);
      }
    }
  };

  const handleAddFriend = async () => {
    try {
      const response = await fetch(`/api/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: userId }),
      });

      if (response.ok) {
        setFriendshipStatus('sent');
      }
    } catch (err) {
      console.error('Error sending friend request:', err);
    }
  };

  const handleRemoveFriend = async () => {
    try {
      const response = await fetch(`/api/friends/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFriendshipStatus('none');
      }
    } catch (err) {
      console.error('Error removing friend:', err);
    }
  };

  const handleCancelRequest = async () => {
    try {
      const response = await fetch(`/api/friends/request/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId: userId }),
      });

      if (response.ok) {
        setFriendshipStatus('none');
      }
    } catch (err) {
      console.error('Error canceling request:', err);
    }
  };

    const handlePhotoUpload = (newPhoto: Photo) => {
      setPhotos(prev => [newPhoto, ...prev]);
    };

    const handlePhotoDelete = (photoId: string) => {
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
        </div>
      </MainLayout>
    );
  }

  if (error || !profile) {
    return (
      <MainLayout>
        <Card className="p-8 text-center max-w-md mx-auto">
          <p className="text-gray-600 mb-4">{error || 'Utilisateur non trouvé'}</p>
          <Button
            onClick={() => router.push('/')}
            className="w-full"
          >
            Retour à l'accueil
          </Button>
        </Card>
      </MainLayout>
    );
  }

  const isOwnProfile = session?.user?.id === profile.id;
  const joinDate = new Date(profile.createdAt);
  const formattedDate = joinDate.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <MainLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl mx-auto"
      >
        {/* Profile Header */}
        <Card className="overflow-hidden mb-6">
          <div className="h-32 bg-gray-100 relative overflow-hidden">
            {profile.coverImage ? (
              <img
                src={optimizeCoverUrl(profile.coverImage, 1600, 320) || profile.coverImage}
                alt={`${profile.username} cover`}
                className="w-full h-32 object-cover"
                loading="eager"
              />
            ) : (
              <div className="w-full h-32 bg-gradient-to-r from-primary-dark to-accent-dark" />
            )}
          </div>

          <div className="px-6 pb-6 -mt-16 relative z-10">
            <div className="flex items-end gap-4 mb-6">
              {profile.avatar ? (
                <img
                  src={optimizeAvatarUrl(profile.avatar, 128) || profile.avatar}
                  alt={profile.username}
                  className="w-32 h-32 rounded-full border-4 border-white object-cover shadow-lg"
                  loading="eager"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white bg-gradient-to-br from-primary-dark to-accent-dark flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                  {profile.username?.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile.fullName}
                  </h1>
                  {profile.isVerified && (
                    <span className="text-blue-500 text-2xl">✓</span>
                  )}
                </div>
                <p className="text-gray-600">@{profile.username}</p>
                {profile.about?.pseudonym && (
                  <p className="text-sm text-gray-500 italic">\"{profile.about.pseudonym}\"</p>
                )}
              </div>

              {!isOwnProfile && (
                <div className="mb-1">
                  {friendshipStatus === 'self' ? null : friendshipStatus === 'accepted' ? (
                    <Button
                      onClick={handleRemoveFriend}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      Supprimer l'ami
                    </Button>
                  ) : friendshipStatus === 'sent' ? (
                    <Button
                      onClick={handleCancelRequest}
                      className="bg-gray-500 hover:bg-gray-600"
                    >
                      Annuler la demande
                    </Button>
                  ) : friendshipStatus === 'pending' ? (
                    <Button
                      onClick={handleAddFriend}
                      className="bg-green-500 hover:bg-green-600"
                    >
                      Accepter
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAddFriend}
                      className="bg-primary-dark hover:bg-accent-dark"
                    >
                      Ajouter un ami
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-gray-700 mb-4">{profile.bio}</p>
            )}

            {/* Info */}
            <div className="flex flex-wrap gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar size={16} />
                <span>Rejoint {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="border-t border-gray-200 px-6 py-4 flex gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{profile.postsCount}</p>
              <p className="text-sm text-gray-600">Publications</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{profile.friendsCount}</p>
              <p className="text-sm text-gray-600">Amis</p>
            </div>
          </div>
        </Card>

        {/* Additional Actions */}
        {!isOwnProfile && (
          <div className="flex gap-3 mb-6">
            <Button
              onClick={() => router.push(`/messages?user=${profile.id}`)}
              className="flex-1 bg-primary-dark hover:bg-accent-dark"
            >
              Envoyer un message
            </Button>
            <Link href={`/users/${profile.id}/posts`} className="flex-1">
              <Button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900">
                Voir les publications
              </Button>
            </Link>
          </div>
        )}

        {isOwnProfile && (
          <div className="flex gap-3 mb-6">
            <Link href="/settings" className="flex-1">
              <Button className="w-full bg-primary-dark hover:bg-accent-dark">
                Modifier le profil
              </Button>
            </Link>
          </div>
        )}

        {/* Top navigation for profile sections (About / Gallery / Posts / Friends) */}
        <Card className="p-2 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1 flex items-center justify-around">
              <button
                onClick={() => handleSectionChange('about')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  selectedSection === 'about'
                    ? 'bg-primary-dark text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">À propos</span>
              </button>

              <button
                onClick={() => handleSectionChange('gallery')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  selectedSection === 'gallery'
                    ? 'bg-primary-dark text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Image className="w-5 h-5" />
                <span className="text-sm font-medium">Galerie</span>
              </button>

              <button
                onClick={() => handleSectionChange('posts')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  selectedSection === 'posts'
                    ? 'bg-primary-dark text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span className="text-sm font-medium">Publications</span>
              </button>

              <button
                onClick={() => handleSectionChange('friends')}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  selectedSection === 'friends'
                    ? 'bg-primary-dark text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-5 h-5" />
                <span className="text-sm font-medium">Amis</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Section content */}
        <div className="mb-6">
          {selectedSection === null && (
            <Card className="p-8 text-center">
              <p className="text-gray-600">Sélectionnez une section pour afficher le contenu</p>
            </Card>
          )}

          {selectedSection === 'about' && (
            <About
              about={{
                dateOfBirth: profile.about?.dateOfBirth,
                originCity: profile.about?.originCity,
                currentCity: profile.about?.currentCity,
                college: profile.about?.collegeName ? { name: profile.about.collegeName } : undefined,
                highSchool: profile.about?.highSchoolName ? { name: profile.about.highSchoolName } : undefined,
                university: profile.about?.universityName ? { name: profile.about.universityName } : undefined,
                pseudonym: profile.about?.pseudonym,
                skills: profile.about?.skills,
              }}
              isOwnProfile={isOwnProfile}
              onEdit={() => router.push('/settings')}
            />
          )}

          {selectedSection === 'gallery' && (
            <PhotoGallery
              userId={profile.id}
              photos={photos}
              isOwnProfile={isOwnProfile}
              profilePhoto={profile.avatar || undefined}
              coverPhoto={profile.coverImage || undefined}
              onPhotoUpload={handlePhotoUpload}
              onPhotoDelete={handlePhotoDelete}
            />
          )}

          {selectedSection === 'posts' && (
            <div>
              {postsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-4">
                  {posts.map((post) => (
                    <Post key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center">
                  <p className="text-gray-600">Aucune publication pour le moment</p>
                </Card>
              )}
            </div>
          )}

          {selectedSection === 'friends' && (
            <Card className="p-6">
              <h3 className="text-lg font-bold mb-2">Amis</h3>
              <p className="text-sm text-gray-600">Voir la liste d'amis et les suggestions.</p>
              <div className="mt-4">
                <Link href={`/users/${profile.id}/friends`}>
                  <Button>Voir les amis</Button>
                </Link>
              </div>
            </Card>
          )}
        </div>
      </motion.div>
    </MainLayout>
  );
}

