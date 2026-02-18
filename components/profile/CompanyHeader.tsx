'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { Avatar } from '@/components/ui/Avatar';
import { optimizeCoverUrl, optimizeAvatarUrl } from '@/lib/cloudinaryOptimizer';

interface CompanyProfileProps {
  profile: any;
}

export default function CompanyHeader({ profile }: CompanyProfileProps) {
  return (
    <Card className="overflow-hidden mb-4 md:mb-6">
      <div className="h-28 md:h-40 bg-gray-100 relative overflow-hidden">
        {profile.coverImage ? (
          <img
            src={optimizeCoverUrl(profile.coverImage, 1920, 360) || profile.coverImage}
            alt={`${profile.fullName} cover`}
            className="w-full h-full object-cover"
            loading="eager"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-dark to-accent-dark" />
        )}
      </div>

      <div className="px-4 md:px-6 pb-4 md:pb-6 -mt-12 relative z-10">
        <div className="flex items-start md:items-center gap-4">
          <div className="w-20 h-20 md:w-28 md:h-28 rounded-lg overflow-hidden border-2 border-white bg-white flex-shrink-0 shadow-lg">
            <Avatar src={optimizeAvatarUrl(profile.avatar, 256) || profile.avatar || null} name={profile.fullName || profile.username} userId={profile.id} size="lg" className="w-full h-full" />
          </div>

          <div className="flex-1 min-w-0">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 break-words">{profile.fullName}</h2>
            {profile.about && profile.about.companyDescription && (
              <p className="text-sm text-gray-600 mt-1 hidden md:block">{profile.about.companyDescription}</p>
            )}

            <div className="mt-3 flex items-center gap-2">
              {profile.website && (
                <a href={profile.website} target="_blank" rel="noreferrer" className="text-sm text-primary-dark hover:underline">Visiter le site</a>
              )}

              <div className="ml-auto flex items-center gap-2">
                <Link href={profile.website || '#'} className="no-underline">
                  <Button className="btn-primary-dark">Visiter</Button>
                </Link>
                <Button className="bg-white text-primary-dark border border-primary-dark hover:bg-primary-dark hover:text-white">Contacter</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200 px-4 md:px-6 py-3 md:py-4 flex gap-6">
        <div>
          <p className="text-lg md:text-2xl font-bold text-gray-900">{profile.postsCount || 0}</p>
          <p className="text-xs text-gray-600">Publications</p>
        </div>
        <div>
          <p className="text-lg md:text-2xl font-bold text-gray-900">{profile.friendsCount || 0}</p>
          <p className="text-xs text-gray-600">Abonnés</p>
        </div>
      </div>
    </Card>
  );
}
