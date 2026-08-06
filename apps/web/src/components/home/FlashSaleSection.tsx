'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Clock, BookOpen, Tag } from 'lucide-react';

export default function FlashSaleSection() {
  const [timeLeft, setTimeLeft] = useState({ hours: 5, minutes: 42, seconds: 18 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return { hours: 0, minutes: 0, seconds: 0 };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-500/30 rounded-2xl p-6 sm:p-8 space-y-6">
      {/* Header with Countdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-amber-500/20 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500 text-white font-bold shadow-lg animate-pulse">
            <Zap className="h-6 w-6 fill-white" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
              FLASH SALE ĐỌC SÁCH SỐ 5.000 VNĐ
            </h2>
            <p className="text-xs text-muted-foreground">
              Ưu đãi đọc trọn bộ sách hot nhất tuần này qua thanh toán VietQR SePay
            </p>
          </div>
        </div>

        {/* Live Countdown Timer */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs font-bold text-muted-foreground uppercase mr-1">Kết thúc sau:</span>
          <div className="flex items-center gap-1 font-mono text-sm font-bold text-white">
            <span className="bg-amber-600 px-2.5 py-1 rounded-lg shadow">{String(timeLeft.hours).padStart(2, '0')}h</span>
            <span className="text-amber-600 font-bold">:</span>
            <span className="bg-amber-600 px-2.5 py-1 rounded-lg shadow">{String(timeLeft.minutes).padStart(2, '0')}m</span>
            <span className="text-amber-600 font-bold">:</span>
            <span className="bg-amber-600 px-2.5 py-1 rounded-lg shadow animate-pulse">{String(timeLeft.seconds).padStart(2, '0')}s</span>
          </div>
        </div>
      </div>

      {/* Flash Sale Featured Book Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            title: 'Đắc Nhân Tâm - Dale Carnegie',
            author: 'Dale Carnegie',
            price: 5000,
            originalPrice: 10000,
            image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600',
            discount: '-50%',
          },
          {
            title: 'Nhà Giả Kim - Paulo Coelho',
            author: 'Paulo Coelho',
            price: 5000,
            originalPrice: 10000,
            image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600',
            discount: '-50%',
          },
        ].map((book, idx) => (
          <div key={idx} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4 hover:border-amber-500/50 transition-colors shadow-sm">
            <img src={book.image} alt={book.title} className="h-20 w-14 object-cover rounded border border-border shrink-0" />
            <div className="flex-1 space-y-1">
              <span className="inline-block text-[10px] font-bold text-amber-600 bg-amber-500/10 px-2 py-0.5 rounded">
                {book.discount} GIỜ VÀNG
              </span>
              <h3 className="font-bold text-sm text-foreground line-clamp-1">{book.title}</h3>
              <p className="text-xs text-muted-foreground">{book.author}</p>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-base font-extrabold text-amber-600">{book.price.toLocaleString('vi-VN')} VNĐ</span>
                <span className="text-xs line-through text-muted-foreground">{book.originalPrice.toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
            <Link
              href="/books"
              className="px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shrink-0"
            >
              Đọc ngay
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
