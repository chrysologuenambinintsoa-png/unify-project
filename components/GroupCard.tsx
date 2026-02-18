'use client';

import { Group } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface GroupCardProps {
  group: Partial<Group> & { _count?: { members: number } };
}

export default function GroupCard({ group }: GroupCardProps) {
  const { translation } = useLanguage();
  return (
    <Link href={`/groups/${group.id}`}>
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow border border-gray-200 dark:border-gray-700">
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
          <h3 className="font-semibold text-lg truncate text-gray-900 dark:text-white">{group.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{group.description || translation.group?.noDescription || 'No description'}</p>
          <div className="mt-3 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Users size={14} />
            <span>{group._count?.members || 0} {translation.group?.members || 'members'}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
