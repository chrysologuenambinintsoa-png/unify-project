import React from 'react';

export function SearchSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 space-y-6 animate-pulse">
      {/* Search input */}
      <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
        ))}
      </div>

      {/* Results grid or list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-3">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
            <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
