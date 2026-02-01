'use client';

import { Story } from '@prisma/client';
import Image from 'next/image';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

interface StoryCardProps {
  story: Partial<Story> & { user?: { id: string; username: string; fullName: string; avatar?: string } };
}

export default function StoryCard({ story }: StoryCardProps) {
  const createdTime = story.createdAt ? formatDistanceToNow(new Date(story.createdAt), { addSuffix: true }) : '';

  return (
    <Link href={`/stories/${story.id}`}>
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {(story.imageUrl || story.videoUrl) && (
          <div className="relative h-40 w-full">
            <Image
              src={story.imageUrl || story.videoUrl || ''}
              alt="Story"
              fill
              className="object-cover"
            />
          </div>
        )}
        <div className="p-4">
          <p className="text-sm text-gray-600 line-clamp-2">{story.text || 'No text'}</p>
          {story.user && (
            <div className="mt-3 flex items-center gap-2">
              {story.user.avatar && (
                <Image src={story.user.avatar} alt={story.user.fullName} width={24} height={24} className="rounded-full" />
              )}
              <div className="text-xs text-gray-500">
                <p className="font-medium text-gray-700">{story.user.fullName}</p>
                <p>{createdTime}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
