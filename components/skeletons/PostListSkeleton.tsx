import React from 'react';

export function PostListSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-4">
          {/* Post header */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
            <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
          
          {/* Image */}
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
          
          {/* Bottom bar */}
          <div className="h-10 bg-gray-100 dark:bg-gray-800 rounded" />
        </div>
      ))}
    </div>
  );
}