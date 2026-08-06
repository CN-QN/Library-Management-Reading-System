import BannerCarousel from '@/components/home/BannerCarousel';
import FlashSaleSection from '@/components/home/FlashSaleSection';
import { HeroSearch } from '@/components/home/HeroSearch';
import { CategoryChips } from '@/components/home/CategoryChips';
import { ContinueReading } from '@/components/home/ContinueReading';
import { TrendingBooks } from '@/components/home/TrendingBooks';
import { NewBooks } from '@/components/home/NewBooks';
import { SectionSkeleton, ContinueReadingSkeleton } from '@/components/home/SectionSkeleton';
import { AsyncSection } from '@/components/common/AsyncSection';
import React from 'react';

// Bắt buộc render động (SSR) thay vì tĩnh (SSG) vì trang này gọi API backend
// lúc runtime. Nếu dùng SSG, Docker build sẽ thất bại do backend chưa chạy.
export const dynamic = 'force-dynamic';

const SECTIONS = [
  { id: 'continue-reading', Component: ContinueReading, Fallback: <ContinueReadingSkeleton /> },
  { id: 'trending-books', Component: TrendingBooks, Fallback: <SectionSkeleton /> },
  { id: 'new-books', Component: NewBooks, Fallback: <SectionSkeleton /> },
];

export default function HomePage() {
  return (
    <main className="container mx-auto px-4 md:px-6 py-6 md:py-8 space-y-8 md:space-y-12">
      <BannerCarousel />
      
      <HeroSearch />

      <FlashSaleSection />
      
      <AsyncSection fallback={<div className="h-14 w-full flex items-center justify-center animate-pulse bg-muted/20 rounded-full" />}>
        <CategoryChips />
      </AsyncSection>

      <div className="space-y-12">
        {SECTIONS.map(({ id, Component, Fallback }) => (
          <AsyncSection key={id} fallback={Fallback}>
            <Component />
          </AsyncSection>
        ))}
      </div>
    </main>
  );
}
