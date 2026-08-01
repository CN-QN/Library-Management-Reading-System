import { getNewReleases } from '@/lib/api/books';
import { BookCard } from '@/components/shared/BookCard';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export async function NewBooks() {
  const books = await getNewReleases(6);

  if (!books || books.length === 0) return null;

  return (
    <section className="w-full py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Sparkles className="w-4 h-4" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Mới cập nhật</h2>
        </div>
        <Link href="/new-releases" className="text-sm font-medium text-primary hover:underline flex items-center gap-1">
          Xem tất cả <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
        {books.map((book) => (
          <BookCard key={book.id} book={book} />
        ))}
      </div>
    </section>
  );
}
