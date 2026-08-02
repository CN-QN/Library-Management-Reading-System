'use client';

import { Search, Sparkles, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Component Tìm kiếm chính (Hero Search) đặt tại trang chủ.
 * Chứa lời kêu gọi hành động (Call to Action) lớn nhằm điều hướng người dùng
 * sang trang Khám phá sách (`/books`) với từ khóa nhập sẵn hoặc toàn bộ thư viện.
 */
export function HeroSearch() {
  const [query, setQuery] = useState('');

  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/books?Keyword=${encodeURIComponent(query.trim())}`);
    } else {
      router.push(`/books`);
    }
  };

  return (
    <section className="relative w-full overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-background px-6 py-12 md:py-20 lg:px-12 flex flex-col items-center text-center">
      <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
      
      <div className="relative z-10 max-w-3xl space-y-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-foreground font-be-vietnam-pro">
          Khám phá tri thức, <br className="hidden md:inline" />
          <span className="text-primary">Mở rộng tương lai</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Hệ thống thư viện số với hàng ngàn đầu sách chất lượng, tài liệu học thuật và tiểu thuyết hấp dẫn.
        </p>
        
        <div className="pt-4 max-w-lg mx-auto w-full">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <Input
              type="search"
              placeholder="Tìm kiếm tên sách, tác giả, thể loại..."
              className="w-full pl-12 pr-4 py-6 text-base md:text-lg rounded-2xl shadow-sm border-muted/50 focus-visible:ring-primary/50 transition-all bg-background/80 backdrop-blur-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          {/* Premium Discover CTA */}
          <div className="mt-10 flex justify-center">
            <Link 
              href="/books"
              className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold text-primary-foreground transition-all duration-300 bg-primary rounded-full hover:bg-primary/90 shadow-sm hover:shadow-[0_0_30px_-5px_rgba(var(--primary),0.6)] hover:-translate-y-1 overflow-hidden"
            >
              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)]">
                <div className="relative h-full w-10 bg-white/20" />
              </div>
              <Sparkles className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Khám phá toàn bộ thư viện</span>
              <ArrowRight className="w-5 h-5 relative z-10 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
