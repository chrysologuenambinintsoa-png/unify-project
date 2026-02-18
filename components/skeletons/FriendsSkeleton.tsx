import React from 'react';

export function FriendsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6 animate-pulse">
      {/* Header */}
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
      
      {/* Badges section */}
      <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-2">
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="flex gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />

      {/* Tabs */}
      <div className="flex gap-2">
        {[...Array(2)].map((_, i) => (
          <div key={i} className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
        ))}
      </div>

      {/* Content cards */}
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
