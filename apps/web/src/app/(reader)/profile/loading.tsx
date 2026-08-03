import React from 'react';

/**
 * Loading Skeleton hiển thị trong lúc Server Component chuẩn bị dữ liệu trang Hồ sơ cá nhân.
 */
export default function ProfileLoading() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 animate-pulse space-y-6">
      {/* Header skeleton */}
      <div className="h-44 rounded-xl bg-muted/60 border border-border/40" />

      {/* Bento grid skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg bg-muted/40 border border-border/30" />
        ))}
      </div>

      {/* Tabs bar skeleton */}
      <div className="h-10 w-80 rounded-md bg-muted/50" />

      {/* Content cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-48 rounded-xl bg-muted/30 border border-border/30" />
        ))}
      </div>
    </div>
  );
}
