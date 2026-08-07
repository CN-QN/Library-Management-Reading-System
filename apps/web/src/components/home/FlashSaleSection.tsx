'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap } from 'lucide-react';
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
  const seconds = Math.max(0, Math.floor((new Date(endTime).getTime() - Date.now()) / 1000));
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return { days, hours, minutes, seconds: secs };
}

export default function FlashSaleSection() {
  const [sale, setSale] = useState<FlashSale | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

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
    <section className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-amber-500 p-3 text-white">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-black">{sale.name}</h2>
            <p className="text-sm text-muted-foreground">
              Giá ưu đãi {sale.salePrice.toLocaleString('vi-VN')}đ, giá gốc{' '}
              {sale.salePrice < sale.originalPrice && (
                <span className="line-through">{sale.originalPrice.toLocaleString('vi-VN')}đ</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 font-mono font-bold text-amber-700">
          {timeLeft.days > 0 && (
            <span className="rounded-md bg-amber-500/20 px-2 py-1 text-sm">
              {timeLeft.days} <span className="text-xs font-normal text-amber-900">ngày</span>
            </span>
          )}
          <span className="rounded-md bg-amber-500/20 px-2 py-1 text-sm">
            {String(timeLeft.hours).padStart(2, '0')} <span className="text-xs font-normal text-amber-900">giờ</span>
          </span>
          <span className="rounded-md bg-amber-500/20 px-2 py-1 text-sm">
            {String(timeLeft.minutes).padStart(2, '0')} <span className="text-xs font-normal text-amber-900">phút</span>
          </span>
          <span className="rounded-md bg-amber-500/20 px-2 py-1 text-sm">
            {String(timeLeft.seconds).padStart(2, '0')} <span className="text-xs font-normal text-amber-900">giây</span>
          </span>
        </div>
      </div>

      <Link
        href="/books"
        className="mt-5 inline-block rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-700"
      >
        Xem sách
      </Link>
    </section>
  );
}
