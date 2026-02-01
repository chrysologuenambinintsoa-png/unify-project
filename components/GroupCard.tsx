'use client';

import { Group } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { Users, Shield } from 'lucide-react';

interface GroupCardProps {
  group: Partial<Group> & { _count?: { members: number } };
}

export default function GroupCard({ group }: GroupCardProps) {
  return (
    <Link href={`/groups/${group.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {group.image && (
          <div className="relative h-32 w-full">
            <Image
              src={group.image}
              alt={group.name || 'Group'}
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-4">
          <h3 className="font-semibold text-lg truncate">{group.name}</h3>
          <p className="text-sm text-gray-600 line-clamp-2">{group.description || 'No description'}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
            <Users size={14} />
            <span>{group._count?.members || 0} members</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
