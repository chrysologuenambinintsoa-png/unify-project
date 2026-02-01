'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Users, MessageSquare, Settings } from 'lucide-react';

export default function PageDetailPage() {
  const params = useParams();
  const pageId = params.pageId as string;
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch(`/api/pages/${pageId}`);
        if (!res.ok) throw new Error('Failed to fetch page');
        const data = await res.json();
        setPage(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    if (pageId) fetchPage();
  }, [pageId]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!page) return <div className="p-6 text-center">Page not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover Image */}
      {page.image && (
        <div className="relative h-64 w-full mb-6 rounded-lg overflow-hidden">
          <Image src={page.image} alt={page.name} fill className="object-cover" />
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{page.name}</h1>
            <p className="text-gray-600">{page.description}</p>
          </div>
          <button className="p-2 hover:bg-gray-100 rounded-lg">
            <Settings size={20} />
          </button>
        </div>

        {/* Stats */}
        <div className="mt-6 flex gap-6">
          <div className="flex items-center gap-2">
            <Users size={20} className="text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{page._count?.members || 0}</p>
              <p className="text-sm text-gray-600">Members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-green-600" />
            <div>
              <p className="text-2xl font-bold">{page._count?.posts || 0}</p>
              <p className="text-sm text-gray-600">Posts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admins */}
      {page.admins && page.admins.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Admins</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {page.admins.map((admin: any) => (
              <div key={admin.user.id} className="text-center">
                {admin.user.avatar && (
                  <Image src={admin.user.avatar} alt={admin.user.fullName} width={60} height={60} className="rounded-full mx-auto mb-2" />
                )}
                <p className="font-semibold text-sm">{admin.user.fullName}</p>
                <p className="text-xs text-gray-500">@{admin.user.username}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Members */}
      {page.members && page.members.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Followers</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {page.members.map((member: any) => (
              <div key={member.user.id} className="text-center">
                {member.user.avatar && (
                  <Image src={member.user.avatar} alt={member.user.fullName} width={60} height={60} className="rounded-full mx-auto mb-2" />
                )}
                <p className="font-semibold text-sm">{member.user.fullName}</p>
                <p className="text-xs text-gray-500">@{member.user.username}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Posts */}
      {page.posts && page.posts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Recent Posts</h2>
          <div className="space-y-4">
            {page.posts.map((post: any) => (
              <div key={post.id} className="border-b pb-4 last:border-b-0">
                <p className="text-gray-800">{post.content}</p>
                <p className="text-xs text-gray-500 mt-2">{new Date(post.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
