import { getCategories } from '@/lib/api/categories';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export async function CategoryChips() {
  const categories = await getCategories();

  if (!categories || categories.length === 0) return null;

  return (
    <section className="w-full py-4 overflow-x-auto no-scrollbar">
      <div className="flex flex-nowrap md:flex-wrap items-center gap-2 md:gap-3 px-1 md:justify-center">
        {categories.map((category) => (
          <Link key={category.id} href={`/books?CategoryId=${category.id}`} className="shrink-0">
            <Badge 
              variant="secondary" 
              className="px-4 py-2 text-sm font-medium hover:bg-primary hover:text-primary-foreground transition-all duration-300 rounded-full cursor-pointer shadow-sm"
            >
              {category.name}
            </Badge>
          </Link>
        ))}
      </div>
    </section>
  );
}
