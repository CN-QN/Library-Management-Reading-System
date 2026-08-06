'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, BookOpen, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BannerSlide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
}

const DEFAULT_SLIDES: BannerSlide[] = [
  {
    id: '1',
    title: 'Chào Hè 2026 - Mở Kho Sách Số 10.000đ',
    subtitle: 'Khám phá hàng nghìn tác phẩm E-Book bản quyền đọc mượt mà trên mọi thiết bị',
    imageUrl: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1200',
    linkUrl: '/books',
  },
  {
    id: '2',
    title: 'Flash Sale Đọc Sách Số Chỉ 5.000 VNĐ',
    subtitle: 'Thanh toán siêu tốc VietQR SePay tự động mở khóa ngay tức thì',
    imageUrl: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=1200',
    linkUrl: '/books',
  },
];

export default function BannerCarousel() {
  const [currentIdx, setCurrentIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % DEFAULT_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = DEFAULT_SLIDES[currentIdx];

  return (
    <div className="relative w-full h-[320px] sm:h-[400px] rounded-2xl overflow-hidden shadow-xl border border-border group">
      {/* Background Image */}
      <img
        src={slide.imageUrl}
        alt={slide.title}
        className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex flex-col justify-center p-6 sm:p-12 text-white">
        <span className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2">
          Nổi Bật Tuần Này
        </span>
        <h2 className="text-2xl sm:text-4xl font-extrabold max-w-xl leading-tight mb-3">
          {slide.title}
        </h2>
        <p className="text-sm sm:text-base text-gray-200 max-w-md line-clamp-2 mb-6">
          {slide.subtitle}
        </p>

        <div>
          <Link
            href={slide.linkUrl}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30"
          >
            <BookOpen className="h-4 w-4" />
            Khám phá kho sách ngay
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={() => setCurrentIdx((prev) => (prev - 1 + DEFAULT_SLIDES.length) % DEFAULT_SLIDES.length)}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={() => setCurrentIdx((prev) => (prev + 1) % DEFAULT_SLIDES.length)}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
        {DEFAULT_SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIdx(i)}
            className={`h-2 rounded-full transition-all ${i === currentIdx ? 'w-6 bg-primary' : 'w-2 bg-white/50'}`}
          />
        ))}
      </div>
    </div>
  );
}
