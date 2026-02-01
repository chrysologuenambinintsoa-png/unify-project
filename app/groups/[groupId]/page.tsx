'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Users, MessageSquare, Settings } from 'lucide-react';

export default function GroupDetailPage() {
  const params = useParams();
  const groupId = params.groupId as string;
  const [group, setGroup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const res = await fetch(`/api/groups/${groupId}`);
        if (!res.ok) throw new Error('Failed to fetch group');
        const data = await res.json();
        setGroup(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load group');
      } finally {
        setLoading(false);
      }
    };

    if (groupId) fetchGroup();
  }, [groupId]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-600">{error}</div>;
  if (!group) return <div className="p-6 text-center">Group not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Cover Image */}
      {group.image && (
        <div className="relative h-64 w-full mb-6 rounded-lg overflow-hidden">
          <Image src={group.image} alt={group.name} fill className="object-cover" />
        </div>
      )}

      {/* Group Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{group.name}</h1>
            <p className="text-gray-600">{group.description}</p>
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
              <p className="text-2xl font-bold">{group._count?.members || 0}</p>
              <p className="text-sm text-gray-600">Members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-green-600" />
            <div>
              <p className="text-2xl font-bold">{group._count?.posts || 0}</p>
              <p className="text-sm text-gray-600">Posts</p>
            </div>
          </div>
        </div>
      </div>

      {/* Members */}
      {group.members && group.members.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Members</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {group.members.map((member: any) => (
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
      {group.posts && group.posts.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold mb-4">Recent Posts</h2>
          <div className="space-y-4">
            {group.posts.map((post: any) => (
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
