import { Metadata } from 'next';
import { getTrendingBooks } from '@/lib/api/books';
import { BookListContainer } from '@/components/reader/books/BookListContainer';
import { TrendingUp } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sách thịnh hành | Thư viện',
  description: 'Danh sách các cuốn sách đang được quan tâm nhiều nhất.',
};

export default async function TrendingPage() {
  const books = await getTrendingBooks(50);

  return (
    <div className="container mx-auto py-8 px-4 md:px-0">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-full bg-orange-500/10 flex items-center justify-center text-orange-500">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Thịnh hành tuần này</h1>
          <p className="text-muted-foreground mt-1">Những cuốn sách được tìm đọc nhiều nhất</p>
        </div>
      </div>

      <div className="flex-1">
        <BookListContainer books={books} />
      </div>
    </div>
  );
}
