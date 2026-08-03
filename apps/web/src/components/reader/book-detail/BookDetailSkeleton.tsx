import { Skeleton } from '@/components/ui/skeleton';

/**
 * BookDetailSkeleton - Component hiển thị khung xương (skeleton loading) cho trang chi tiết sách.
 *
 * Được sử dụng chung bởi route loading.tsx của Reader Portal.
 */
export function BookDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-12 animate-pulse">
      {/* Hero Section Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Cover Skeleton */}
        <div className="md:col-span-4 lg:col-span-3 flex justify-center">
          <Skeleton className="w-full max-w-[280px] aspect-[2/3] rounded-lg shadow-md" />
        </div>

        {/* Info & Meta Skeleton */}
        <div className="md:col-span-8 lg:col-span-9 space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/3" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>

          {/* Metadata Grid Skeleton - sử dụng map để render 4 ô */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg border bg-muted/20">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>

          {/* CTA Skeleton */}
          <div className="flex flex-wrap gap-4 pt-2">
            <Skeleton className="h-11 w-40 rounded-md" />
            <Skeleton className="h-11 w-44 rounded-md" />
          </div>

          {/* Summary Skeleton */}
          <div className="space-y-2 pt-4">
            <Skeleton className="h-6 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </div>

      {/* Chapter List Skeleton - sử dụng map để render 3 dòng chương */}
      <div className="space-y-4 pt-6 border-t">
        <Skeleton className="h-7 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-md" />
          ))}
        </div>
      </div>
    </div>
  );
}
