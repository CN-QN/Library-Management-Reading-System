'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
}

export default function BannerCarousel() {
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const res = await apiClient.get<{ data?: BannerSlide[] }>('/banners?activeOnly=true');
        const data = res.data?.data || [];
        setSlides(data);
      } catch (err) {
        console.error('Lỗi khi tải Banner từ API:', err);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (slides.length === 0) {
    return null;
  }

  const slide = slides[currentIdx];

  return (
    <div className="relative w-full h-[340px] sm:h-[420px] rounded-3xl overflow-hidden shadow-2xl border border-border/60 group bg-slate-950 select-none">
      {/* Background Image Ambient Glow & Main Banner Cover */}
      {slide.imageUrl && (
        <>
          <Image
            src={slide.imageUrl}
            alt=""
            fill
            aria-hidden="true"
            className="object-cover scale-110 blur-2xl opacity-50 pointer-events-none transition-all duration-1000"
          />
          <Image
            src={slide.imageUrl}
            alt={slide.title}
            fill
            priority
            sizes="100vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </>
      )}

      {/* Multi-Stop Premium Gradient Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/20 flex flex-col justify-center p-6 sm:p-14 text-white z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-bold w-fit mb-3 backdrop-blur-md">
          <Sparkles className="h-3.5 w-3.5 text-amber-400" />
          <span>NỔI BẬT TUẦN NÀY</span>
        </div>
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black max-w-2xl leading-tight mb-3 text-white drop-shadow-md">
          {slide.title}
        </h2>
        <p className="text-sm sm:text-base text-gray-200/90 max-w-lg line-clamp-2 mb-7 leading-relaxed font-medium">
          {slide.subtitle}
        </p>

        <div>
          <Link
            href={slide.linkUrl || '/books'}
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 hover:scale-105 active:scale-95"
          >
            <BookOpen className="h-4 w-4" />
            <span>Khám phá kho sách ngay</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Navigation Buttons */}
      {slides.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIdx((prev) => (prev - 1 + slides.length) % slides.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 z-20 backdrop-blur-sm border border-white/10 cursor-pointer"
            aria-label="Banner trước"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            onClick={() => setCurrentIdx((prev) => (prev + 1) % slides.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/40 text-white hover:bg-black/70 transition-all opacity-0 group-hover:opacity-100 z-20 backdrop-blur-sm border border-white/10 cursor-pointer"
            aria-label="Banner tiếp theo"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIdx(i)}
                className={`h-2 rounded-full transition-all cursor-pointer ${i === currentIdx ? 'w-8 bg-primary shadow-sm' : 'w-2 bg-white/40 hover:bg-white/70'}`}
                aria-label={`Chuyển banner ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
