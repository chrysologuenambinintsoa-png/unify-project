'use client';

import React, { useState, useEffect } from 'react';
import { Users, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Member {
  id: string;
  user: {
    id: string;
    username: string;
    fullName?: string;
    avatar?: string;
  };
  role: string;
}

interface PageMembersProps {
  pageId: string;
  isAdmin: boolean;
}

export function PageMembers({ pageId, isAdmin }: PageMembersProps) {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMembers();
  }, [pageId]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/pages/${pageId}/members`);
      if (!res.ok) throw new Error('Failed to fetch members');
      const data = await res.json();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading members');
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    if (!confirm('Remove this member?')) return;

    try {
      const res = await fetch(`/api/pages/${pageId}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId }),
      });

      if (!res.ok) throw new Error('Failed to remove member');
      setMembers(members.filter(m => m.id !== memberId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error removing member');
    }
  };

  const updateRole = async (memberId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/pages/${pageId}/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memberId, role: newRole }),
      });

      if (!res.ok) throw new Error('Failed to update role');
      fetchMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error updating role');
    }
  };

  if (loading) return <div className="p-4">Loading members...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Users className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold">Members ({members.length})</h3>
      </div>

      {error && <div className="bg-red-500/20 text-red-300 p-3 rounded-lg text-sm">{error}</div>}

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {members.map(member => (
          <div
            key={member.id}
            className="flex items-center justify-between p-3 bg-gray-800/30 rounded-lg border border-amber-500/20 hover:border-amber-500/40 transition"
          >
            <div className="flex items-center space-x-3 flex-1">
              {member.user.avatar && (
                <img
                  src={member.user.avatar}
                  alt={member.user.username}
                  className="w-8 h-8 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <p className="font-medium">{member.user.fullName || member.user.username}</p>
                <p className="text-xs text-gray-400">@{member.user.username}</p>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center space-x-2">
                <select
                  value={member.role}
                  onChange={(e) => updateRole(member.id, e.target.value)}
                  className="bg-gray-700 text-white text-sm px-2 py-1 rounded border border-amber-500/30 focus:outline-none focus:border-amber-500"
                >
                  <option value="member">Member</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMember(member.id)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
