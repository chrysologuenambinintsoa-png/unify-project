// This file must exist but should render nothing
// Returning null prevents any loading UI from showing
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-3xl px-4">
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
