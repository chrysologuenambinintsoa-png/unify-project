"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Post from "@/components/Post";
import { LoadingPage } from "@/components/LoadingPage";
import { Loader } from "lucide-react";

interface PostData {
  id: string;
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
    username?: string;
  };
  images?: string[];
  videos?: string[];
  createdAt: Date;
  updatedAt?: Date;
  likes?: number;
  comments?: number;
  shares?: number;
  liked?: boolean;
}

export default function PostsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [postsLoaded, setPostsLoaded] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchPosts();
    }
  }, [session]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/posts");
      if (!response.ok) throw new Error("Failed to fetch posts");
      const data = await response.json();
      setPosts(data || []);
      setPostsLoaded(true);
      setError(null);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete post");
      setPosts(posts.filter(p => p.id !== postId));
    } catch (err) {
      console.error("Error deleting post:", err);
      setError("Failed to delete post");
    }
  };

  const handleLike = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/like`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to like post");
      // Refetch posts to get updated counts
      await fetchPosts();
    } catch (err) {
      console.error("Error liking post:", err);
    }
  };

  if (status === "loading" || loading) {
    return <LoadingPage message="Chargement des publications..." />;
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Explore Posts</h1>
          <p className="text-gray-600">Discover posts from your network</p>
        </div>

        {/* Posts List */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No posts yet. Be the first to post something!</p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Post
                key={post.id}
                post={post}
                onDelete={handleDeletePost}
                onLike={handleLike}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
