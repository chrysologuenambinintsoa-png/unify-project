'use client';

import React, { useState, useEffect } from 'react';
import CompanyHeader from '@/components/profile/CompanyHeader';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useLanguage } from '@/contexts/LanguageContext';
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
  isCompany?: boolean;
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
  const [friendshipLoading, setFriendshipLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [selectedSection, setSelectedSection] = useState<'about' | 'gallery' | 'posts' | 'friends' | null>(null);

  useEffect(() => {
    // Guard: only fetch if userId is defined and not undefined
    if (!userId) {
      setLoading(false);
      return;
    }

    const fetchAllData = async () => {
      try {
        setLoading(true);
        
        // Fetch profile data
        const profileResponse = await fetch(`/api/users/${userId}/profile`);
        if (!profileResponse.ok) {
          if (profileResponse.status === 404) {
            setError('Utilisateur non trouvé');
          } else {
            setError('Erreur lors du chargement du profil');
          }
          setProfile(null);
          setLoading(false);
          return;
        }

        const profileData = await profileResponse.json();
        const user = profileData.user || {};
        const derivedIsCompany = !!(user.isCompany || user.about?.companyDescription || user.isBusiness || user.website);
        setProfile({ ...user, isCompany: derivedIsCompany });
        setFriendshipStatus(profileData.friendshipStatus || 'none');

        // Fetch posts, friends, and photos in parallel
        const [postsRes, friendsRes, photosRes] = await Promise.all([
          fetch(`/api/users/${userId}/posts`),
          fetch(`/api/users/${userId}/friends`),
          fetch(`/api/users/${userId}/photos`),
        ]);

        // Handle posts
        if (postsRes.ok) {
          const postsData = await postsRes.json();
          setPosts(Array.isArray(postsData) ? postsData : postsData.posts || []);
        } else {
          setPosts([]);
        }

        // Handle friends
        if (friendsRes.ok) {
          const friendsData = await friendsRes.json();
          setFriends(Array.isArray(friendsData) ? friendsData : friendsData.friends || []);
          setFriendsLoaded(true);
        } else {
          setFriends([]);
        }

        // Handle photos
        if (photosRes.ok) {
          const photosData = await photosRes.json();
          setPhotos(Array.isArray(photosData.photos) ? photosData.photos : []);
          setPhotosLoaded(true);
        } else {
          setPhotos([]);
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [userId]);

  // Handle section changes with optimized loading
  const handleSectionChange = async (section: 'about' | 'gallery' | 'posts' | 'friends' | null) => {
    setSelectedSection(section);
    
    // Refresh gallery photos if gallery section is selected and not yet loaded
    if (section === 'gallery' && !photosLoaded) {
      try {
        setPhotosLoading(true);
        const response = await fetch(`/api/users/${userId}/photos`);
        if (response.ok) {
          const data = await response.json();
          setPhotos(Array.isArray(data.photos) ? data.photos : []);
          setPhotosLoaded(true);
        }
      } catch (err) {
        console.error('Error refreshing photos:', err);
      } finally {
        setPhotosLoading(false);
      }
    }
    
    // Fetch friends if friends section is selected and not yet loaded
    if (section === 'friends' && !friendsLoaded) {
      try {
        setFriendsLoading(true);
        const response = await fetch(`/api/users/${userId}/friends`);
        if (response.ok) {
          const data = await response.json();
          setFriends(Array.isArray(data) ? data : data.friends || []);
          setFriendsLoaded(true);
        } else {
          setFriends([]);
        }
      } catch (err) {
        console.error('Error fetching friends:', err);
        setFriends([]);
      } finally {
        setFriendsLoading(false);
      }
    }
  };

  const handleAddFriend = async () => {
    try {
      setFriendshipLoading(true);
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
    } finally {
      setFriendshipLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    try {
      setFriendshipLoading(true);
      const response = await fetch(`/api/friends/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFriendshipStatus('none');
      }
    } catch (err) {
      console.error('Error removing friend:', err);
    } finally {
      setFriendshipLoading(false);
    }
  };

  const handleCancelRequest = async () => {
    try {
      setFriendshipLoading(true);
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
    } finally {
      setFriendshipLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      setFriendshipLoading(true);
      
      // First, fetch the pending friendship to get its ID
      const friendsResponse = await fetch('/api/friends?type=pending');
      if (!friendsResponse.ok) {
        throw new Error('Error fetching friend requests');
      }
      
      const friendsData = await friendsResponse.json();

      // API returns { friends: [...] } where each item has a `friend` field (for pending: friend = user1)
      // keep backwards compatibility with older response shapes that used `requests` or `fromUser`
      const list = friendsData.friends ?? friendsData.requests ?? [];
      const pendingRequest = list.find((r: any) => {
        const requester = r.friend || r.user1 || r.fromUser;
        return requester?.id === userId;
      });

      if (!pendingRequest) {
        throw new Error('Friend request not found');
      }

      // Now accept the friendship
      const response = await fetch(`/api/friends`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendshipId: pendingRequest.id, status: 'accepted' }),
      });

      if (response.ok) {
        setFriendshipStatus('accepted');
      } else {
        throw new Error('Failed to accept friend request');
      }
    } catch (err) {
      console.error('Error accepting friend request:', err);
    } finally {
      setFriendshipLoading(false);
    }
  };

  const handlePhotoUpload = (newPhoto: Photo) => {
    setPhotos(prev => [newPhoto, ...prev]);
  };

    const handlePhotoDelete = (photoId: string) => {
      setPhotos(prev => prev.filter(p => p.id !== photoId));
    };

  if (loading) {
    return null;
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
      <div className="w-full max-w-3xl mx-auto px-3 md:px-0">
        {/* Profile Header */}
        {profile.isCompany ? (
          /* Company header for business profiles */
          <>
            {/* Render company header component */}
            <CompanyHeader profile={profile} />
          </>
        ) : (
          <Card className="overflow-hidden mb-4 md:mb-6">
          <div className="h-20 md:h-32 bg-gray-100 relative overflow-hidden will-change-transform">
            {profile.coverImage ? (
              <img
                src={optimizeCoverUrl(profile.coverImage, 1920, 360) || profile.coverImage}
                alt={`${profile.username} cover`}
                className="w-full h-full object-cover will-change-transform"
                loading="eager"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary-dark to-accent-dark" />
            )}
          </div>

          <div className="px-3 md:px-6 pb-4 md:pb-6 -mt-8 md:-mt-16 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-3 md:gap-4 mb-4 md:mb-6">
              {profile.avatar ? (
                <img
                  src={optimizeAvatarUrl(profile.avatar, 256) || profile.avatar}
                  alt={profile.username}
                  className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-white object-cover object-center shadow-lg flex-shrink-0 will-change-transform bg-gradient-to-br from-primary-dark to-accent-dark"
                  loading="eager"
                  decoding="async"
                />
              ) : (
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full border-4 border-white bg-gradient-to-br from-primary-dark to-accent-dark flex items-center justify-center text-white text-2xl md:text-4xl font-bold shadow-lg flex-shrink-0">
                  {profile.username?.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl md:text-3xl font-bold text-gray-900 break-words">
                    {profile.fullName}
                  </h1>
                  {profile.isVerified && (
                    <span className="text-blue-500 text-lg md:text-2xl flex-shrink-0">✓</span>
                  )}
                </div>
                <p className="text-sm md:text-base text-gray-600 truncate">@{profile.username}</p>
                {profile.about?.pseudonym && (
                  <p className="text-xs md:text-sm text-gray-500 italic break-words">\"{profile.about.pseudonym}\"</p>
                )}
              </div>

              {!isOwnProfile && (
                <div className="w-full md:w-auto md:mb-1">
                  {friendshipStatus === 'self' ? null : friendshipStatus === 'accepted' ? (
                    <Button
                      onClick={handleRemoveFriend}
                      disabled={friendshipLoading}
                      className="w-full bg-red-500 hover:bg-red-600 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {friendshipLoading ? (translation.messages?.removingFriend || 'Deleting...') : (translation.buttons?.removeFriend || 'Remove friend')}
                    </Button>
                  ) : friendshipStatus === 'sent' ? (
                    <Button
                      onClick={handleCancelRequest}
                      disabled={friendshipLoading}
                      className="w-full bg-gray-500 hover:bg-gray-600 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {friendshipLoading ? 'Annulation...' : 'Annuler la demande'}
                    </Button>
                  ) : friendshipStatus === 'pending' ? (
                    <Button
                      onClick={handleAcceptRequest}
                      disabled={friendshipLoading}
                      className="w-full bg-green-500 hover:bg-green-600 text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {friendshipLoading ? 'Acceptation...' : 'Accepter'}
                    </Button>
                  ) : (
                    <Button
                      onClick={handleAddFriend}
                      disabled={friendshipLoading}
                      className="w-full bg-primary-dark hover:bg-accent-dark text-sm md:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {friendshipLoading ? (translation.messages?.addingFriend || 'Sending...') : (translation.buttons?.addFriend || 'Add friend')}
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-sm md:text-base text-gray-700 mb-3 md:mb-4 break-words">{profile.bio}</p>
            )}

            {/* Info */}
            <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <Calendar size={14} className="md:w-4 md:h-4" />
                <span className="break-words">Rejoint {formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="border-t border-gray-200 px-3 md:px-6 py-3 md:py-4 flex gap-3 md:gap-6 justify-around md:justify-start">
            <div className="text-center md:text-left">
              <p className="text-lg md:text-2xl font-bold text-gray-900">{profile.postsCount}</p>
              <p className="text-xs md:text-sm text-gray-600">Publications</p>
            </div>
            <div className="text-center md:text-left">
              <p className="text-lg md:text-2xl font-bold text-gray-900">{profile.friendsCount}</p>
              <p className="text-xs md:text-sm text-gray-600">Amis</p>
            </div>
          </div>
        </Card>
        )}

        {/* Additional Actions */}
        {!isOwnProfile && (
          <div className="flex flex-col md:flex-row gap-2 md:gap-3 mb-4 md:mb-6">
            <Button
              onClick={() => router.push(`/messages?user=${profile.id}`)}
              className="flex-1 bg-primary-dark hover:bg-accent-dark text-sm md:text-base"
            >
              {translation.buttons?.sendMessage || 'Send message'}
            </Button>
            <Link href={`/users/${profile.id}/posts`} className="flex-1">
              <Button className="w-full bg-gray-200 hover:bg-gray-300 text-gray-900 text-sm md:text-base">
                Voir les publications
              </Button>
            </Link>
          </div>
        )}

        {isOwnProfile && (
          <div className="flex gap-2 md:gap-3 mb-4 md:mb-6">
            <Link href="/settings" className="flex-1">
              <Button className="w-full bg-primary-dark hover:bg-accent-dark text-sm md:text-base">
              {translation.buttons?.editProfile || 'Edit profile'}
              </Button>
            </Link>
          </div>
        )}

        {/* Top navigation for profile sections (About / Gallery / Posts / Friends) */}
        <Card className="p-1 md:p-2 mb-4 md:mb-6 overflow-x-auto">
          <div className="flex items-center justify-between min-w-min">
            <div className="flex-1 flex items-center justify-between md:justify-around gap-1 md:gap-0">
              <button
                onClick={() => handleSectionChange('about')}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm whitespace-nowrap ${
                  selectedSection === 'about'
                    ? 'bg-primary-dark text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="font-medium hidden md:inline">À propos</span>
                <span className="font-medium md:hidden">À propos</span>
              </button>

              <button
                onClick={() => handleSectionChange('gallery')}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm whitespace-nowrap ${
                  selectedSection === 'gallery'
                    ? 'bg-primary-dark text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Image className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="font-medium hidden md:inline">Galerie</span>
                <span className="font-medium md:hidden">Galerie</span>
              </button>

              <button
                onClick={() => handleSectionChange('posts')}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm whitespace-nowrap ${
                  selectedSection === 'posts'
                    ? 'bg-primary-dark text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="font-medium hidden md:inline">Publications</span>
                <span className="font-medium md:hidden">Publics</span>
              </button>

              <button
                onClick={() => handleSectionChange('friends')}
                className={`flex items-center gap-1 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm whitespace-nowrap ${
                  selectedSection === 'friends'
                    ? 'bg-primary-dark text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                <span className="font-medium hidden md:inline">Amis</span>
                <span className="font-medium md:hidden">Amis</span>
              </button>
            </div>
          </div>
        </Card>

        {/* Section content with smooth transitions */}
        <div className="mb-4 md:mb-6">
          {selectedSection === null && (
            <Card className="p-4 md:p-8 text-center animate-fadeIn">
              <p className="text-sm md:text-base text-gray-600">Sélectionnez une section pour afficher le contenu</p>
            </Card>
          )}

          {selectedSection === 'about' && (
            <div className="animate-fadeIn">
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
            </div>
          )}

          {selectedSection === 'gallery' && (
            <div className="animate-fadeIn">
              {photosLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
                </div>
              ) : (
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
            </div>
          )}

          {selectedSection === 'posts' && (
            <div className="animate-fadeIn">
              {posts.length > 0 ? (
                <div className="space-y-3 md:space-y-4">
                  {posts.map((post) => (
                    <Post key={post.id} post={post} />
                  ))}
                </div>
              ) : (
                <Card className="p-4 md:p-6 text-center">
                  <p className="text-sm md:text-base text-gray-600">{translation.pageLabels?.noPublications || 'No publications yet'}</p>
                </Card>
              )}
            </div>
          )}

          {selectedSection === 'friends' && (
            <div className="animate-fadeIn">
              {friendsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="rounded-full h-8 w-8 border-b-2 border-primary-dark"></div>
                </div>
              ) : friends.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 md:gap-3">
                  {friends.map((friend) => (
                    <Link key={friend.id || friend.friend?.id} href={`/users/${friend.id || friend.friend?.id}/profile`}>
                      <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer text-center">
                        <img
                          src={friend.avatar || friend.friend?.avatar || '/default-avatar.png'}
                          alt={friend.fullName || friend.friend?.fullName}
                          className="w-12 h-12 md:w-16 md:h-16 rounded-full object-cover mx-auto mb-1.5"
                        />
                        <p className="font-medium text-xs md:text-sm truncate">{friend.fullName || friend.friend?.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">@{friend.username || friend.friend?.username}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <Card className="p-4 md:p-6 text-center">
                  <p className="text-sm md:text-base text-gray-600">Aucun ami pour le moment</p>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        :global(.animate-fadeIn) {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </MainLayout>
  );
}

