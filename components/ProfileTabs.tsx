"use client";
import React from "react";
import Link from "next/link";

export default function ProfileTabs({
  userId,
  active = "posts",
}: {
  userId: string;
  active?: string;
}) {
  const tabs = [
    { key: "posts", label: "Publications", href: `/users/${userId}/posts` },
    { key: "about", label: "À propos", href: `/users/${userId}/about` },
    { key: "friends", label: "Amis", href: `/users/${userId}/friends` },
    { key: "photos", label: "Photos", href: `/users/${userId}/photos` },
  ];

  return (
    <nav className="mt-4 max-w-5xl mx-auto px-4 sm:px-6">
      <ul className="flex gap-2 bg-white rounded-md shadow-sm p-1">
        {tabs.map((t) => (
          <li key={t.key}>
            <Link
              href={t.href}
              className={`inline-flex items-center px-4 py-2 rounded-md text-sm font-medium ${
                active === t.key ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
