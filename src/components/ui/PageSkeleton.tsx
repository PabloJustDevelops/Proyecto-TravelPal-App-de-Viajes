export default function PageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2 w-full sm:w-1/3">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32 self-start sm:self-auto"></div>
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-20"></div>

      {/* Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 h-48 space-y-4"
          >
            <div className="flex justify-between items-start">
              <div className="space-y-2 w-2/3">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
              </div>
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            </div>
            <div className="space-y-2 pt-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
