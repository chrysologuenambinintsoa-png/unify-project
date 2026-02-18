import React from 'react';

export function NotificationsSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-4 animate-pulse">
      {/* Filter bar */}
      <div className="flex gap-2 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-10 w-28 bg-gray-200 dark:bg-gray-700 rounded-full" />
        ))}
      </div>

      {/* Notification cards */}
      <div className="space-y-3">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="p-4 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-start gap-4">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0" />
            
            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-1/2 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>

            {/* Timestamp */}
            <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
