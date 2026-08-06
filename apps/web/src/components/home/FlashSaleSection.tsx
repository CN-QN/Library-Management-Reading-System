'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, Clock, ArrowRight } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface FlashSale {
  id: string;
  name: string;
  originalPrice: number;
  salePrice: number;
  startTime: string;
  endTime: string;
  status: string;
}

function remaining(endTime: string) {
  const seconds = Math.max(
    0,
    Math.floor((new Date(endTime).getTime() - Date.now()) / 1000)
  );
  return {
    hours: Math.floor(seconds / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
  };
}

export default function FlashSaleSection() {
  const [sale, setSale] = useState<FlashSale | null>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    void apiClient
      .get<{ data?: FlashSale | null }>('/flashsale/current')
      .then((r) => {
        const value = r.data?.data ?? null;
        setSale(value);
        if (value) setTimeLeft(remaining(value.endTime));
      })
      .catch(() => setSale(null));
  }, []);

  useEffect(() => {
    if (!sale) return;
    const timer = setInterval(() => setTimeLeft(remaining(sale.endTime)), 1000);
    return () => clearInterval(timer);
  }, [sale]);

  if (!sale) return null;

  return (
    <section className="w-full rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/5 p-6 sm:p-8 shadow-sm backdrop-blur-sm">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-amber-500 p-3.5 text-white shadow-lg shadow-amber-500/30 shrink-0 animate-pulse">
            <Zap className="h-7 w-7 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Flash Sale Giờ Vàng
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">{sale.name}</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 font-medium">
              Giá ưu đãi <span className="font-bold text-amber-600 dark:text-amber-400">{sale.salePrice.toLocaleString('vi-VN')}đ</span>, giá gốc <span className="line-through">{sale.originalPrice.toLocaleString('vi-VN')}đ</span>
            </p>
          </div>
        </div>

        {/* Digital Countdown Timer */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground mr-1">
            <Clock className="h-4 w-4 text-amber-500" />
            <span>Kết thúc sau:</span>
          </div>
          <div className="flex items-center gap-1 font-mono text-sm font-black">
            <div className="px-2.5 py-1.5 rounded-xl bg-amber-600 text-white shadow-sm min-w-[36px] text-center">
              {String(timeLeft.hours).padStart(2, '0')}
            </div>
            <span className="text-amber-600 font-bold">:</span>
            <div className="px-2.5 py-1.5 rounded-xl bg-amber-600 text-white shadow-sm min-w-[36px] text-center">
              {String(timeLeft.minutes).padStart(2, '0')}
            </div>
            <span className="text-amber-600 font-bold">:</span>
            <div className="px-2.5 py-1.5 rounded-xl bg-amber-600 text-white shadow-sm min-w-[36px] text-center">
              {String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>

          <Link
            href="/books"
            className="ml-2 inline-flex items-center gap-1.5 rounded-xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-amber-700 transition-all hover:scale-105"
          >
            <span>Xem sách</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
