"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import {
  MessageSquare,
  Settings,
  Camera,
  Share2,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { motion } from "framer-motion";
import { PageManagementPanel } from "@/components/PageManagementPanel";
import { PageMembers } from "@/components/PageMembers";
import { PagePostCreator } from "@/components/PagePostCreator";
import { CoverImageUploadModal } from "@/components/CoverImageUploadModal";
import Post from "@/components/Post";
import { PageSkeleton } from "@/components/skeletons/PageSkeleton";

interface Page {
  id: string;
  name: string;
  description?: string | null;
  avatar?: string | null;
  profileImage?: string | null;
  coverImage?: string | null;
  category?: string | null;
  website?: string | null;
  createdAt: string;
  owner?: {
    id: string;
    username?: string;
    fullName?: string;
  } | null;
  admins?: Array<{ user?: { id: string; username?: string; fullName?: string } }>;
  posts?: any[];
  _count?: {
    members?: number;
    posts?: number;
  };
}

interface PageClientProps {
  pageId: string;
}

export function PageDetailClient({ pageId }: PageClientProps) {
  const { translation } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "posts" | "members" | "settings">("overview");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [showCoverUpload, setShowCoverUpload] = useState(false);
  const [showAvatarUpload, setShowAvatarUpload] = useState(false);

  // Update activeTab when searchParams change
  useEffect(() => {
    const tabParam = searchParams?.get?.("tab");
    if (tabParam) setActiveTab(tabParam as any);
  }, [searchParams]);

  useEffect(() => {
    if (pageId) fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageId]);

  const fetchPage = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/pages/${pageId}`);
      if (!res.ok) throw new Error("Failed to fetch page");
      const data = await res.json();
      // Map profileImage to avatar for consistency
      if (data.profileImage && !data.avatar) {
        data.avatar = data.profileImage;
      }
      setPage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load page");
    } finally {
      setLoading(false);
    }
  };

  // Lightweight refresh for posts only
  const refreshPagePosts = async () => {
    if (!page) return;
    try {
      const res = await fetch(`/api/pages/${pageId}`);
      if (!res.ok) throw new Error("Failed to fetch page");
      const data = await res.json();
      // Only update posts, keep rest of page state
      setPage(prev => prev ? { ...prev, posts: data.posts, _count: { posts: data._count?.posts || 0, members: prev._count?.members || 0 } } : null);
    } catch (err) {
      console.error("Error refreshing posts:", err);
    }
  };

  // determine admin status after page or session loads
  useEffect(() => {
    if (!page) return;
    const userId = (session as any)?.user?.id;
    if (!userId) {
      setIsAdmin(false);
      return;
    }
    // page may include admins array from API
    const admins = (page as any).admins || [];
    const isAdminLocal = !!admins.find((a: any) => a.user?.id === userId) || page.owner?.id === userId;
    setIsAdmin(isAdminLocal);
  }, [page, session]);

  const handleCoverUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "cover");

      const res = await fetch(`/api/pages/${pageId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload cover");
      const data = await res.json();
      setPage((prev) => (prev ? { ...prev, coverImage: data.coverImage } : prev));
      setShowCoverUpload(false);
    } catch (err) {
      console.error("Error uploading cover:", err);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "avatar");

      const res = await fetch(`/api/pages/${pageId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Failed to upload avatar");
      const data = await res.json();
      setPage((prev) => (prev ? { ...prev, avatar: data.avatar } : prev));
      setShowAvatarUpload(false);
    } catch (err) {
      console.error("Error uploading avatar:", err);
    }
  };

  const handleFollowPage = async () => {
    try {
      const res = await fetch(`/api/pages/${pageId}/follow`, { method: "POST" });
      if (!res.ok) throw new Error("Failed to follow page");
      setIsFollowing((v) => !v);
    } catch (err) {
      console.error("Error following page:", err);
    }
  };

  if (loading)
    return (
      <MainLayout>
        <PageSkeleton />
      </MainLayout>
    );
  if (error)
    return (
      <MainLayout>
        <div className="p-6 text-center text-red-600">{error}</div>
      </MainLayout>
    );

  if (!page)
    return (
      <MainLayout>
        <div className="p-6 text-center">{translation.page?.pageNotFound || 'Page not found'}</div>
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
            {page.coverImage ? (
              <Image src={page.coverImage} alt={page.name} fill className="object-cover" />
            ) : null}
            {isAdmin && (
              <button
                onClick={() => setShowCoverUpload((s) => !s)}
                className="absolute bottom-4 right-4 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-100 transition shadow-lg"
                aria-label={translation.page?.changeCover || 'Change cover'}
              >
                <Camera size={20} />
              </button>
            )}
          </div>

          {/* Page Header with Avatar */}
          <div className="relative px-6 pb-6">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="relative -mt-16">
                <div className="relative w-32 h-32 rounded-xl overflow-hidden border-4 border-white shadow-lg bg-gray-200">
                  {page.avatar ? (
                    <Image src={page.avatar} alt={page.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-accent dark:from-primary-dark dark:to-accent">
                      <span className="text-white text-4xl font-bold">{page.name?.charAt(0)}</span>
                    </div>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => setShowAvatarUpload((s) => !s)}
                      className="absolute bottom-2 right-2 bg-white text-gray-900 p-1 rounded-full hover:bg-gray-100 transition shadow-lg"
                      aria-label={translation.page?.changeAvatar || 'Change avatar'}
                    >
                      <Camera size={16} />
                    </button>
                  )}
                </div>
              </div>

              {/* Page Info */}
              <div className="flex-1 flex items-end justify-between pb-2">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-1">{page.name}</h1>
                  <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
                    {page.category && <span className="capitalize">{page.category}</span>}
                    <span>{page._count?.members || 0} {translation.page?.followers || 'followers'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!isAdmin && (
                    <>
                      <Button 
                        variant="primary" 
                        size="sm" 
                        onClick={handleFollowPage} 
                        className="flex items-center gap-2 font-semibold"
                      >
                        {isFollowing ? ("✓ " + (translation.page?.following || 'Following')) : ("+ " + (translation.page?.followThisPage || 'Follow this page'))}
                      </Button>
                    </>
                  )}
                  {isAdmin && (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => setActiveTab("settings")} 
                      className="flex items-center gap-2"
                    >
                      <Settings size={16} />
                      {translation.page?.manage || 'Manage'}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Share2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        {page.description && (
          <Card className="mb-6 p-6">
            <p className="text-gray-700">{page.description}</p>
            {page.website && (
              <a href={page.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline mt-3 inline-block">
                {page.website}
              </a>
            )}
          </Card>
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200">
            {(["overview", "posts", "members", "settings"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 font-medium text-sm transition ${
                  activeTab === tab ? "border-b-2 border-primary dark:border-accent text-primary dark:text-accent" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
              >
                {tab === "overview" && (translation.page?.overview || 'Overview')}
                {tab === "posts" && (translation.page?.posts || 'Posts')}
                {tab === "members" && (translation.page?.followers || 'Followers')}
                {tab === "settings" && (translation.page?.settings || 'Settings')}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary dark:text-accent">{page._count?.members || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{translation.page?.followers || 'Followers'}</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary/80 dark:text-accent/80">{page._count?.posts || 0}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{translation.page?.posts || 'Posts'}</p>
                  </Card>
                  <Card className="p-4 text-center">
                    <p className="text-2xl font-bold text-primary/60 dark:text-accent/60">{new Date(page.createdAt).toLocaleDateString("fr-FR")}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{translation.page?.created || 'Created'}</p>
                  </Card>
                </div>
              </div>
              <div>
                <Card className="p-6">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{translation.page?.information || 'Information'}</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">{translation.page?.admin || 'Admin'}</p>
                      <p className="font-medium text-gray-900 dark:text-white">{page.owner?.fullName || page.owner?.username || translation.common?.unknown || 'Unknown'}</p>
                    </div>
                    {page.category && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">{translation.page?.category || 'Category'}</p>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">{page.category}</p>
                      </div>
                    )}
                    {page.website && (
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">{translation.page?.website || 'Website'}</p>
                        <a href={page.website} target="_blank" rel="noopener noreferrer" className="font-medium text-primary dark:text-accent hover:underline">
                          {translation.page?.visit || 'Visit'}
                        </a>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "posts" && (
            <div className="space-y-4">
              {isAdmin && <PagePostCreator pageId={pageId} onPostCreated={refreshPagePosts} />}

              {page.posts && page.posts.length > 0 ? (
                page.posts.map((post: any) => <Post key={post.id} post={post} />)
              ) : (
                <Card className="p-12 text-center">
                  <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">{translation.page?.noPosts || 'No posts yet'}</p>
                </Card>
              )}
            </div>
          )}

          {activeTab === "members" && <PageMembers pageId={pageId} isAdmin={isAdmin} />}

          {activeTab === "settings" && isAdmin && (
            <PageManagementPanel
              pageId={pageId}
              pageData={{
                name: page.name,
                description: page.description || "",
                visibility: "public",
                profileImage: page.avatar || undefined,
              }}
              isAdmin={isAdmin}
              onPageUpdated={fetchPage}
            />
          )}
        </div>

        {/* Cover Upload Modal */}
        <CoverImageUploadModal isOpen={showCoverUpload} onClose={() => setShowCoverUpload(false)} onUpload={handleCoverUpload} currentImage={page.coverImage || undefined} title={translation.page?.changeCover || 'Change page cover'} />

        {/* Avatar Upload Modal */}
        <CoverImageUploadModal isOpen={showAvatarUpload} onClose={() => setShowAvatarUpload(false)} onUpload={handleAvatarUpload} currentImage={page.avatar || undefined} title={translation.page?.changeAvatar || 'Change page avatar'} />
      </motion.div>
    </MainLayout>
  );
}
