'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, FolderTree, Search, ChevronRight } from 'lucide-react';
import { deriveCategoriesFromBooks } from '@/lib/api/categories';
import { searchBooks } from '@/lib/api/books';
import { BookCategorySnapshot } from '@/types/Book';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { buttonVariants, Button } from '@/components/ui/button';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<BookCategorySnapshot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchAllCategories() {
      try {
        setIsLoading(true);
        // Derive categories from embedded book metadata — does NOT call /api/categories
        const booksResult = await searchBooks({ Limit: 200, Page: 1 });
        const derived = deriveCategoriesFromBooks(booksResult.items);
        setCategories(derived);
      } catch (err) {
        console.error('Error loading categories:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAllCategories();
  }, []);

  const filteredCategories = categories.filter((cat) =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background border rounded-2xl p-6 sm:p-8">
        <div className="max-w-2xl space-y-4">
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <FolderTree className="w-4 h-4" />
            <span>Khám phá thư viện</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Thể Loại Sách</h1>
          <p className="text-muted-foreground text-sm sm:text-base">
            Duyệt qua các thể loại sách đa dạng từ giáo trình chuyên ngành đến tiểu thuyết, khoa học và phát triển bản thân.
          </p>

          {/* Search Bar */}
          <div className="relative max-w-md pt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Tìm kiếm thể loại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card/80 border-primary/20 focus-visible:ring-primary"
            />
          </div>
        </div>
      </div>

      {/* Main Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="space-y-2">
                <div className="h-6 w-1/2 bg-muted rounded"></div>
                <div className="h-4 w-3/4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 w-full bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredCategories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((cat) => (
            <Card
              key={cat.categoryId}
              className="group hover:shadow-lg transition-all border-border/60 hover:border-primary/50 bg-card flex flex-col"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl group-hover:text-primary transition-colors flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-primary shrink-0" />
                      <Link href={`/categories/${cat.slug}`} className="hover:underline">
                        {cat.name}
                      </Link>
                    </CardTitle>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col justify-between pt-0 space-y-4">
                {/* Explore Button */}
                <div className="pt-3 flex justify-end">
                  <Link
                    href={`/categories/${cat.slug}`}
                    className={buttonVariants({
                      variant: 'ghost',
                      size: 'sm',
                      className: 'group-hover:translate-x-1 transition-transform text-primary hover:text-primary font-medium',
                    })}
                  >
                    Xem sách <ChevronRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-card rounded-xl border border-dashed p-8 space-y-4">
          <FolderTree className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">Không tìm thấy thể loại nào</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Không có thể loại nào phù hợp với từ khóa &quot;{searchQuery}&quot;. Vui lòng thử tìm kiếm lại.
          </p>
          <Button variant="outline" onClick={() => setSearchQuery('')}>
            Xóa tìm kiếm
          </Button>
        </div>
      )}
    </div>
  );
}
