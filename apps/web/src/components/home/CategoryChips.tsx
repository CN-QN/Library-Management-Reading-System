import { searchBooks } from '@/lib/api/books';
import { deriveCategoriesFromBooks } from '@/lib/api/categories';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export async function CategoryChips() {
  let categories: { categoryId: string; name: string; slug: string }[] = [];

  try {
    // Derive distinct categories from the books endpoint using embedded
    // Book.categories[].slug — no longer calls /api/categories.
    const result = await searchBooks({ Limit: 100, Page: 1 });
    categories = deriveCategoriesFromBooks(result.items);
  } catch {
    // Silently fail; the homepage still renders without chips.
  }

  if (!categories || categories.length === 0) return null;

  return (
    <section className="w-full py-4 overflow-x-auto no-scrollbar">
      <div className="flex flex-nowrap md:flex-wrap items-center gap-2 md:gap-3 px-1 md:justify-center">
        {categories.map((category) => (
          <Link key={category.categoryId} href={`/books?CategoryId=${category.categoryId}`} className="shrink-0">
            <Badge 
              variant="secondary" 
              className="px-5 py-2.5 sm:px-6 sm:py-3 text-sm sm:text-base font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-2xl sm:rounded-full cursor-pointer shadow-xs hover:shadow-md hover:scale-105 active:scale-95 border border-border/50"
            >
              {category.name}
            </Badge>
          </Link>
        ))}
      </div>
    </section>
  );
}
