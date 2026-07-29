'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function HeroSearch() {
  const [query, setQuery] = useState('');

  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
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
        </div>
      </div>
    </section>
  );
}
