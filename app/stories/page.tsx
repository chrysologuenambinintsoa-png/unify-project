"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Stories from "@/components/Stories";
import { LoadingPage } from "@/components/LoadingPage";
import { Loader } from "lucide-react";

interface Story {
  id: string;
  user: {
    id: string;
    name: string;
    avatar: string;
    username?: string;
  };
  image: string;
  timestamp: Date;
  viewed?: boolean;
}

export default function StoriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchStories();
    }
  }, [session]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stories");
      if (!response.ok) throw new Error("Failed to fetch stories");
      const data = await response.json();
      setStories(data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching stories:", err);
      setError("Failed to load stories");
    } finally {
      setLoading(false);
    }
  };

  const handleStoryCreated = () => {
    fetchStories();
  };

  if (status === "loading" || loading) {
    return <LoadingPage message="Chargement des histoires..." />;
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Stories</h1>
          <p className="text-gray-600">Share your moments with your friends</p>
        </div>

        {/* Stories Grid */}
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {error}
          </div>
        ) : stories.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No stories yet. Be the first to create one!</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6">
            <Stories 
              stories={stories} 
              currentUser={session?.user ? {
                id: session.user.id || "",
                name: session.user.name || "User",
                avatar: session.user.image || ""
              } : undefined}
            />
          </div>
        )}
      </div>
    </div>
  );
}
