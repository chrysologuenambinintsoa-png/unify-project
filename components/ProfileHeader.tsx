"use client";
import React from "react";
import Link from "next/link";
import { Avatar } from '@/components/ui/Avatar';

type UserProfile = {
  id: string;
  username?: string | null;
  fullName?: string | null;
  bio?: string | null;
  avatar?: string | null;
  cover?: string | null;
};

export default function ProfileHeader({
  user,
  isOwner = false,
}: {
  user: UserProfile;
  isOwner?: boolean;
}) {
  const fullName = user.fullName || user.username || "Utilisateur";

  return (
    <div className="w-full">
      <div className="relative h-44 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 overflow-hidden rounded-b-lg">
        {user.cover ? (
          <img
            src={user.cover}
            alt="cover"
            className="absolute inset-0 w-full h-full object-cover opacity-90"
          />
        ) : null}
        <div className="absolute inset-0 bg-black/10" />
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 -mt-12">
        <div className="bg-white/90 backdrop-blur rounded-lg shadow-md p-4 flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="relative w-28 h-28 rounded-full overflow-hidden ring-4 ring-white">
              <Avatar src={user.avatar || null} name={fullName} userId={user.id} size="xl" className="w-full h-full" />
            </div>
          </div>

          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-slate-800">{fullName}</h2>
            {user.username ? <div className="text-sm text-slate-500">@{user.username}</div> : null}
            {user.bio ? <p className="mt-2 text-sm text-slate-600">{user.bio}</p> : null}
          </div>

          <div className="flex-shrink-0 flex items-center gap-2">
            {isOwner ? (
              <Link href="#" className="px-4 py-2 bg-indigo-600 text-white rounded-md">Editer le profil</Link>
            ) : (
              <>
                <button className="px-4 py-2 bg-white border rounded-md">Ajouter</button>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-md">Message</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
