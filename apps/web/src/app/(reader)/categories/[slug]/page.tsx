'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { ChevronRight, BookOpen, ArrowUpDown } from 'lucide-react';
import { getCategoryBySlug, getCategories, getBooksByCategory } from '@/lib/api/categories';
import { Category } from '@/types/Category';
import { Book } from '@/types/Book';
import { BookCard } from '@/components/home/BookCard';
import { Badge } from '@/components/ui/badge';
import { buttonVariants, Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CategoryDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function CategoryDetailPage({ params }: CategoryDetailPageProps) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;

  const [category, setCategory] = useState<Category | null>(null);
  const [subcategories, setSubcategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    async function loadCategoryData() {
      try {
        setIsLoading(true);
        const cat = await getCategoryBySlug(slug);
        setCategory(cat);

        if (cat) {
          const allCats = await getCategories();
          const children = allCats.filter((c) => c.parentId === cat.id);
          setSubcategories(children);
        }

        const booksData = await getBooksByCategory(cat?.id || slug, currentPage, 12, sortBy);
        setBooks(booksData.items);
        setTotalPages(booksData.totalPages);
        setTotalItems(booksData.totalItems);
      } catch (error) {
        console.error('Failed to load category page data:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadCategoryData();
  }, [slug, currentPage, sortBy]);

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumbs Navigation */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="hover:text-foreground transition-colors">
          Trang chủ
        </Link>
        <ChevronRight className="w-4 h-4" />
        <Link href="/categories" className="hover:text-foreground transition-colors">
          Thể loại
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-foreground font-medium truncate">
          {category ? category.name : slug}
        </span>
      </nav>

      {/* Category Header */}
      <div className="bg-card border rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">
              {category ? category.name : 'Danh mục sách'}
            </h1>
            {category?.description && (
              <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
                {category.description}
              </p>
            )}
          </div>
          <Badge variant="secondary" className="w-fit text-sm px-3 py-1">
            {totalItems} cuốn sách
          </Badge>
        </div>

        {/* Subcategories Chips Navigation */}
        {subcategories.length > 0 && (
          <div className="pt-4 border-t border-border/50 space-y-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Danh mục con:
            </span>
            <div className="flex flex-wrap gap-2">
              {subcategories.map((sub) => (
                <Link key={sub.id} href={`/categories/${sub.slug}`}>
                  <Badge
                    variant="outline"
                    className="hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer text-xs py-1 px-3"
                  >
                    {sub.name}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sorting Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="text-sm text-muted-foreground">
          Hiển thị <span className="font-semibold text-foreground">{books.length}</span> trên{' '}
          <span className="font-semibold text-foreground">{totalItems}</span> kết quả
        </div>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
            <ArrowUpDown className="w-4 h-4" /> Sắp xếp:
          </span>
          <Select value={sortBy} onValueChange={(val) => setSortBy(val ?? 'newest')}>
            <SelectTrigger className="w-[160px] h-9 text-sm">
              <SelectValue placeholder="Sắp xếp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mới nhất</SelectItem>
              <SelectItem value="popular">Phổ biến nhất</SelectItem>
              <SelectItem value="title">Tên A-Z</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Books Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-[2/3] bg-muted animate-pulse rounded-lg"></div>
          ))}
        </div>
      ) : books.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-16 bg-card rounded-xl border border-dashed p-8 space-y-4">
          <BookOpen className="w-12 h-12 text-muted-foreground mx-auto" />
          <h3 className="text-lg font-semibold">Chưa có sách trong thể loại này</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">
            Hiện tại chưa có đầu sách nào thuộc thể loại này. Vui lòng khám phá các thể loại khác.
          </p>
          <Link href="/categories" className={buttonVariants({ variant: 'outline' })}>
            Xem tất cả thể loại
          </Link>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          >
            Trang trước
          </Button>
          <span className="text-sm text-muted-foreground px-2">
            Trang {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          >
            Trang sau
          </Button>
        </div>
      )}
    </div>
  );
}
