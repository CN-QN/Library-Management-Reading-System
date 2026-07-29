import { Suspense } from 'react';
import { HeroSearch } from '@/components/home/HeroSearch';
import { CategoryChips } from '@/components/home/CategoryChips';
import { ContinueReading } from '@/components/home/ContinueReading';
import { TrendingBooks } from '@/components/home/TrendingBooks';
import { NewBooks } from '@/components/home/NewBooks';
import { SectionSkeleton, ContinueReadingSkeleton } from '@/components/home/SectionSkeleton';
import { ErrorBoundary } from '@/components/ui/error-boundary';

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8 md:space-y-12">
      <HeroSearch />
      
      <ErrorBoundary>
        <Suspense fallback={<div className="h-14 w-full flex items-center justify-center animate-pulse bg-muted/20 rounded-full" />}>
          <CategoryChips />
        </Suspense>
      </ErrorBoundary>

      <div className="space-y-12">
        <ErrorBoundary>
          <Suspense fallback={<ContinueReadingSkeleton />}>
            <ContinueReading />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <TrendingBooks />
          </Suspense>
        </ErrorBoundary>

        <ErrorBoundary>
          <Suspense fallback={<SectionSkeleton />}>
            <NewBooks />
          </Suspense>
        </ErrorBoundary>
      </div>
    </main>
  );
}
