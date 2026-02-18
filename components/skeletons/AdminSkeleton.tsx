import React from 'react';

export function AdminSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* Header */}
      <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded mb-6" />
      
      {/* List items */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}